import express from "express";
import { completionStatus } from "./completion.js";
import mongoose from "mongoose";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { Module, Progress, User, Audit } from "./models.js";
import { TrainingAttempt } from "./training-models.js";
import {
  COURSES,
  COURSE_VERSION,
  QUIZ_SECONDS,
  REFERENCES,
  courseOverview,
  AVAILABLE_MODULE_KEYS,
} from "./training-content.js";

// Resolve content using the stored module key, never a client-supplied score.
function getCourse(key) {
  if (!AVAILABLE_MODULE_KEYS.includes(key))
    fail(404, "This module is not available yet.");
  return COURSES[key];
}
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const shuffled = (items) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export function activityBreakdown(a) {
  if (a.moduleKey !== "hazard-perception") {
    return {
      activityScore: Math.min(
        70,
        Math.max(0, a.activityAnswers.filter((x) => x.correct).length * 14),
      ),
    };
  }
  const identificationScore = Math.min(
    35,
    (a.classifications || []).filter((x) => x.correct && x.flagged).length * 7,
  );
  const responseScore = Math.min(
    35,
    a.activityAnswers.filter((x) => x.correct).length * 7,
  );
  const falseFlagPenalty = Math.min(6, new Set(a.safeFindings || []).size * 2);
  return {
    identificationScore,
    responseScore,
    falseFlagPenalty,
    activityScore: Math.max(
      0,
      Math.min(70, identificationScore + responseScore - falseFlagPenalty),
    ),
  };
}
export function calculateResult(a) {
  const breakdown = activityBreakdown(a);
  const { activityScore } = breakdown;
  const quizScore = Math.min(
    30,
    a.quizAnswers.filter((x) => x.correct).length * 6,
  );
  const score = activityScore + quizScore;
  const isHeight = a.moduleKey === "working-at-height";
  const isHazard = a.moduleKey === "hazard-perception";
  return {
    activityScore,
    quizScore,
    score,
    passed: score >= 70,
    stars: score >= 85 ? 3 : score >= 70 ? 2 : 1,
    classification: score >= 85 ? "Excellent" : score >= 70 ? "Pass" : "Retake",
    ...(isHazard ? { activityBreakdown: breakdown } : {}),
    feedback: isHazard
      ? score >= 85
        ? "Excellent awareness in this safety walk. Keep observing conditions, using suitable controls and reporting uncertain risks through your site’s procedures. A simulation result is not a workplace safety approval."
        : score >= 70
          ? "You passed this module. Review the areas you misclassified or the controls you missed. In real work, always raise an uncertain concern rather than protecting a score."
          : "This attempt needs a retake. Review your observations and safer responses, then repeat the untimed walk. Inspecting is free: take time to understand the condition before judging it."
      : score >= 85
        ? isHeight
          ? "Excellent planning decisions. Keep applying the avoid, prevent and minimise hierarchy. This result does not authorise work at height; training, supervision and a site-specific plan still matter."
          : "Excellent work. You made consistently safer decisions in this scenario. Keep applying the assessment-first approach and your workplace procedures."
        : score >= 70
          ? isHeight
            ? "You passed this module. Review any missed controls and continue to follow the site’s work-at-height plan. Use only suitable equipment under the required competence, supervision and authorisation arrangements."
            : "You passed this module. Review the decisions you missed and keep using suitable equipment and a planned route. You can practise again to improve your best score."
          : "This attempt needs a retake. Review the explanations, revisit the five checkpoints and try again. Stopping to reassess is a good safety habit.",
  };
}
const taskFeedback = (answer, course) => {
  const t = course.tasks.find((t) => t.id === answer.taskId);
  return {
    kind: "activity",
    id: t.id,
    title: t.title,
    correct:
      course.type === "hunt"
        ? Boolean(answer.correct && answer.identificationCorrect)
        : answer.correct,
    points:
      course.type === "hunt"
        ? (answer.correct ? 7 : 0) + (answer.identificationCorrect ? 7 : 0)
        : answer.correct
          ? 14
          : 0,
    ...(course.type === "hunt"
      ? {
          identificationPoints: answer.identificationCorrect ? 7 : 0,
          responsePoints: answer.correct ? 7 : 0,
          maxPoints: 14,
        }
      : {}),
    selected: t.options.find((o) => o.id === answer.optionId)?.text,
    correctAnswer: t.options.find((o) => o.id === t.correctId).text,
    explanation: t.explanation,
    reference: REFERENCES[t.reference],
  };
};
const quizFeedback = (answer, course) => {
  const q = course.questions.find((q) => q.id === answer.questionId);
  return {
    kind: "quiz",
    id: q.id,
    title: q.prompt,
    correct: answer.correct,
    points: answer.correct ? 6 : 0,
    timedOut: answer.timedOut,
    selected: q.options.find((o) => o.id === answer.optionId)?.text || null,
    correctAnswer: q.options.find((o) => o.id === q.correctId).text,
    explanation: q.explanation,
    reference: REFERENCES[q.reference],
  };
};
function classificationFeedback(entry, course) {
  const object = course.objects.find((o) => o.id === entry.objectId);
  const area = course.areas[entry.objectId];
  const isHazard = course.tasks.some((t) => t.objectId === entry.objectId);
  return {
    kind: "classification",
    id: entry.objectId,
    title: object.label,
    correct: entry.correct,
    isHazard,
    points: isHazard ? (entry.correct ? 7 : 0) : entry.correct ? 0 : -2,
    maxPoints: isHazard ? 7 : 0,
    selected: entry.flagged ? "Hazard — needs action" : "No hazard shown here",
    correctAnswer: isHazard
      ? "Hazard — needs a suitable control"
      : "No hazard represented at this comparison area",
    explanation:
      area.feedback +
      (!isHazard && !entry.correct
        ? " The two-mark deduction applies only to this clearly depicted comparison. In real work, report uncertain concerns and seek advice."
        : ""),
    reference: REFERENCES[area.reference],
  };
}
function finishActivityIfComplete(a, course) {
  const responsesDone = a.activityAnswers.length === course.tasks.length;
  const areasDone =
    course.type !== "hunt" ||
    (a.classifications || []).length === course.objects.length;
  if (responsesDone && areasDone) a.phase = "quiz-ready";
}
function safeInspection(a, course) {
  if (course.type !== "hunt" || !a.selectedObjectId) return null;
  const object = course.objects.find((o) => o.id === a.selectedObjectId);
  if (!object) return null;
  const entry = (a.classifications || []).find((x) => x.objectId === object.id);
  const task = course.tasks.find((t) => t.objectId === object.id);
  const answer = task && a.activityAnswers.find((x) => x.taskId === task.id);
  return {
    id: object.id,
    label: object.label,
    observation: course.areas[object.id].observation,
    classification: entry
      ? {
          flagged: entry.flagged,
          correct: entry.correct,
          isHazard: Boolean(task),
          feedback: classificationFeedback(entry, course),
        }
      : null,
    controlDone: Boolean(answer),
    controlFeedback: answer ? taskFeedback(answer, course) : null,
  };
}
function finishIfComplete(a) {
  if (a.quizAnswers.length !== 5) return;
  const score = calculateResult(a);
  Object.assign(a, {
    phase: "completed",
    open: false,
    completedAt: new Date(),
    activityScore: score.activityScore,
    quizScore: score.quizScore,
    score: score.score,
  });
}
function expireQuestion(a) {
  if (
    a.phase !== "quiz" ||
    !a.questionDeadline ||
    Date.now() < a.questionDeadline.getTime()
  )
    return false;
  a.quizAnswers.push({
    questionId: a.quizOrder[a.quizAnswers.length],
    optionId: null,
    correct: false,
    timedOut: true,
    answeredAt: new Date(),
  });
  a.phase = "feedback";
  a.questionDeadline = null;
  a.questionStartedAt = null;
  finishIfComplete(a);
  return true;
}
async function saveBest(a) {
  if (a.phase !== "completed") return;
  if (!(await User.exists({ _id: a.employeeId, role: "employee" })))
    fail(404, "Employee no longer exists.");
  const query = { employeeId: a.employeeId, moduleKey: a.moduleKey };
  const count = await TrainingAttempt.countDocuments({
    ...query,
    phase: "completed",
  });
  const best = {
    score: a.score,
    activityScore: a.activityScore,
    quizScore: a.quizScore,
    bestAttemptId: a._id,
    assessedAt: a.completedAt,
    source: "assessment",
  };
  try {
    await Progress.updateOne(
      query,
      { $setOnInsert: { ...query, ...best, attempts: count } },
      { upsert: true },
    );
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
  // Demonstration scores are replaced, not allowed to override a real first attempt.
  await Progress.updateOne(
    {
      ...query,
      $or: [{ source: { $ne: "assessment" } }, { bestAttemptId: null }],
    },
    { $set: { ...best, attempts: count } },
  );
  // A later assessed retake can only improve the recorded best score.
  await Progress.updateOne(
    { ...query, source: "assessment", score: { $lt: a.score } },
    { $set: best },
  );
  await Progress.updateOne(query, { $max: { attempts: count } });
  await Progress.updateOne(
    {
      ...query,
      $or: [
        { lastAssessedAt: null },
        { lastAssessedAt: { $lt: a.completedAt } },
      ],
    },
    { $set: { lastScore: a.score, lastAssessedAt: a.completedAt } },
  );
  const claimed = await TrainingAttempt.updateOne(
    { _id: a._id, recordedAt: null },
    { $set: { recordedAt: new Date() } },
  );
  if (claimed.modifiedCount) {
    const user = await User.findById(a.employeeId).lean();
    if (user)
      await Audit.create({
        actorId: user._id,
        actorName: `${user.firstName} ${user.lastName}`,
        action: `completed a ${getCourse(a.moduleKey).title} assessment`,
        subject: `${a.score}/100 · ${a.score >= 70 ? "Pass" : "Retake"}`,
      });
  }
}
function safeAttempt(a) {
  const course = getCourse(a.moduleKey);
  const hunt = course.type === "hunt";
  const nextTask = hunt ? null : course.tasks[a.activityAnswers.length];
  const selected = course.tasks.find((t) => t.id === a.selectedTaskId);
  let currentQuestion = null;
  if (a.phase === "quiz") {
    const q = course.questions.find(
      (q) => q.id === a.quizOrder[a.quizAnswers.length],
    );
    const order = a.optionOrders.get(q.id);
    currentQuestion = {
      id: q.id,
      prompt: q.prompt,
      options: order.map((id) => q.options.find((o) => o.id === id)),
      number: a.quizAnswers.length + 1,
      deadline: a.questionDeadline,
      seconds: QUIZ_SECONDS,
    };
  }
  const answers = a.activityAnswers.map((x) => ({
    taskId: x.taskId,
    objectId: course.tasks.find((t) => t.id === x.taskId).objectId,
    correct: hunt ? Boolean(x.correct && x.identificationCorrect) : x.correct,
    ...(hunt
      ? { points: (x.correct ? 7 : 0) + (x.identificationCorrect ? 7 : 0) }
      : {}),
  }));
  return {
    id: String(a._id),
    moduleKey: a.moduleKey,
    phase: a.phase,
    createdAt: a.createdAt,
    completedAt: a.completedAt,
    activityAnswers: answers,
    activityDone: answers.length,
    activityScore: activityBreakdown(a).activityScore,
    ...(hunt
      ? {
          inspection: safeInspection(a, course),
          areasReviewed: (a.classifications || []).length,
          areaCount: course.objects.length,
          falseFlagCount: (a.safeFindings || []).length,
          activityBreakdown: activityBreakdown(a),
          classifications: (a.classifications || []).map((x) => ({
            objectId: x.objectId,
            flagged: x.flagged,
            correct: x.correct,
            isHazard: course.tasks.some((t) => t.objectId === x.objectId),
          })),
        }
      : {}),
    nextTask: nextTask
      ? {
          id: nextTask.id,
          objectId: nextTask.objectId,
          title: nextTask.title,
          number: answers.length + 1,
        }
      : null,
    task:
      a.phase === "activity" &&
      selected &&
      (hunt
        ? (a.classifications || []).some(
            (x) => x.objectId === selected.objectId,
          ) && !a.activityAnswers.some((x) => x.taskId === selected.id)
        : selected.id === nextTask?.id) &&
      a.inspected.includes(selected.objectId)
        ? {
            id: selected.id,
            objectId: selected.objectId,
            title: selected.title,
            prompt: selected.prompt,
            options: a.optionOrders
              .get(selected.id)
              .map((id) => selected.options.find((o) => o.id === id)),
          }
        : null,
    quizDone: a.quizAnswers.length,
    currentQuestion,
    lastQuizQuestionId: a.quizAnswers.at(-1)?.questionId || null,
    lastFeedback:
      ["feedback", "completed"].includes(a.phase) && a.quizAnswers.length
        ? quizFeedback(a.quizAnswers.at(-1), course)
        : null,
    result:
      a.phase === "completed"
        ? {
            ...calculateResult(a),
            ...(hunt
              ? {
                  inspectionReview: (a.classifications || []).map((x) =>
                    classificationFeedback(x, course),
                  ),
                }
              : {}),
            review: [
              ...a.activityAnswers.map((answer) =>
                taskFeedback(answer, course),
              ),
              ...a.quizAnswers.map((answer) => quizFeedback(answer, course)),
            ],
          }
        : null,
  };
}
// Optimistic concurrency works across tabs/processes; replayed answers are idempotent.
async function changeAttempt(req, operation = () => ({})) {
  if (!mongoose.isValidObjectId(req.params.id)) fail(404, "Attempt not found.");
  for (let n = 0; n < 4; n++) {
    const a = await TrainingAttempt.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
      moduleKey: { $in: AVAILABLE_MODULE_KEYS },
    });
    if (!a) fail(404, "Attempt not found.");
    const expired = expireQuestion(a);
    const extra = await operation(a, getCourse(a.moduleKey));
    try {
      if (a.isModified() || expired) await a.save();
      await saveBest(a);
      const best = await Progress.findOne({
        employeeId: a.employeeId,
        moduleKey: a.moduleKey,
      }).lean();
      return {
        attempt: safeAttempt(a),
        bestScore:
          best?.source === "assessment" && best.bestAttemptId
            ? best.score
            : null,
        ...(a.phase === "completed"
          ? { completion: await completionStatus(req.user) }
          : {}),
        serverNow: Date.now(),
        ...extra,
      };
    } catch (e) {
      if (e.name !== "VersionError") throw e;
    }
  }
  fail(409, "This attempt changed in another tab. Reload it to continue.");
}
export async function activeTraining(employeeId) {
  const active = await TrainingAttempt.find({
    employeeId,
    moduleKey: { $in: AVAILABLE_MODULE_KEYS },
    open: true,
  })
    .select("_id phase moduleKey")
    .lean();
  return Object.fromEntries(
    active.map((a) => [a.moduleKey, { id: String(a._id), phase: a.phase }]),
  );
}
export function createTrainingRouter() {
  const router = express.Router();
  router.use((req, res, next) =>
    req.user.role === "employee"
      ? next()
      : next(
          Object.assign(
            new Error("Training is available to employee accounts."),
            { status: 403 },
          ),
        ),
  );
  router.get("/:moduleKey", async (req, res) => {
    const KEY = req.params.moduleKey;
    getCourse(KEY);
    const [module, best, active, history] = await Promise.all([
      Module.findOne({ key: KEY }).populate("trainerId").lean(),
      Progress.findOne({ employeeId: req.user._id, moduleKey: KEY }).lean(),
      TrainingAttempt.findOne({
        employeeId: req.user._id,
        moduleKey: KEY,
        open: true,
      })
        .select("_id")
        .lean(),
      TrainingAttempt.find({
        employeeId: req.user._id,
        moduleKey: KEY,
        phase: "completed",
      })
        .sort({ completedAt: -1 })
        .limit(10)
        .lean(),
    ]);
    const trainer =
      module?.trainerId?.status === "active" ? module.trainerId : null;
    res.json({
      course: courseOverview(KEY),
      trainer: trainer
        ? {
            nickname: trainer.nickname,
            imageUrl: trainer.imageUrl,
            introduction: trainer.introduction,
          }
        : null,
      bestScore:
        best?.source === "assessment" && best.bestAttemptId ? best.score : null,
      activeAttemptId: active ? String(active._id) : null,
      history: history.map((a) => ({
        id: String(a._id),
        completedAt: a.completedAt,
        ...calculateResult(a),
      })),
      serverNow: Date.now(),
    });
  });
  router.post("/:moduleKey/start", async (req, res) => {
    const KEY = req.params.moduleKey;
    const course = getCourse(KEY);
    z.object({ acknowledged: z.literal(true) })
      .strict()
      .parse(req.body);
    let a = await TrainingAttempt.findOne({
      employeeId: req.user._id,
      moduleKey: KEY,
      open: true,
    });
    if (!a) {
      const order = shuffled(course.questions.map((q) => q.id)).slice(0, 5);
      const optionOrders = Object.fromEntries(
        [...course.tasks, ...course.questions].map((q) => [
          q.id,
          shuffled(q.options.map((o) => o.id)),
        ]),
      );
      try {
        a = await TrainingAttempt.create({
          employeeId: req.user._id,
          moduleKey: KEY,
          version: course.version || COURSE_VERSION,
          quizOrder: order,
          optionOrders,
        });
      } catch (e) {
        if (e.code !== 11000) throw e;
        a = await TrainingAttempt.findOne({
          employeeId: req.user._id,
          moduleKey: KEY,
          open: true,
        });
        if (!a) throw e;
      }
    }
    req.params.id = String(a._id);
    res.json(await changeAttempt(req));
  });
  router.get("/attempts/:id", async (req, res) =>
    res.json(await changeAttempt(req)),
  );
  router.post("/attempts/:id/inspect", async (req, res) => {
    const { objectId } = z
      .object({ objectId: z.string().min(1).max(40) })
      .strict()
      .parse(req.body);
    res.json(
      await changeAttempt(req, (a, course) => {
        if (a.phase !== "activity")
          fail(409, "The practical activity is already complete.");
        if (course.type === "hunt") {
          if (!course.objects.some((o) => o.id === objectId))
            fail(404, "Area not found.");
          a.selectedObjectId = objectId;
          a.selectedTaskId =
            course.tasks.find((t) => t.objectId === objectId)?.id || null;
          if (!a.inspected.includes(objectId)) a.inspected.push(objectId);
          return {};
        }
        const task = course.tasks[a.activityAnswers.length];
        if (task.objectId !== objectId)
          fail(
            409,
            `Complete checkpoint ${a.activityAnswers.length + 1}: ${task.title}, first.`,
          );
        if (!a.inspected.includes(objectId)) a.inspected.push(objectId);
        a.selectedTaskId = task.id;
        return {};
      }),
    );
  });
  router.post("/attempts/:id/classify", async (req, res) => {
    const input = z
      .object({ objectId: z.string().min(1).max(40), flagged: z.boolean() })
      .strict()
      .parse(req.body);
    res.json(
      await changeAttempt(req, (a, course) => {
        if (course.type !== "hunt")
          fail(409, "Area classification belongs to Hazard Perception only.");
        const recorded = (a.classifications || []).find(
          (x) => x.objectId === input.objectId,
        );
        if (recorded)
          return { feedback: classificationFeedback(recorded, course) };
        if (a.phase !== "activity")
          fail(409, "The safety walk is no longer accepting decisions.");
        if (!course.objects.some((o) => o.id === input.objectId))
          fail(404, "Area not found.");
        if (!a.inspected.includes(input.objectId))
          fail(409, "Inspect this area before classifying it.");
        const task = course.tasks.find((t) => t.objectId === input.objectId);
        const entry = {
          objectId: input.objectId,
          flagged: input.flagged,
          correct: input.flagged === Boolean(task),
          classifiedAt: new Date(),
        };
        a.classifications.push(entry);
        if (input.flagged && !task && !a.safeFindings.includes(input.objectId))
          a.safeFindings.push(input.objectId);
        a.selectedObjectId = input.objectId;
        a.selectedTaskId = task?.id || null;
        finishActivityIfComplete(a, course);
        return { feedback: classificationFeedback(entry, course) };
      }),
    );
  });
  router.post("/attempts/:id/activity-answer", async (req, res) => {
    const input = z
      .object({
        taskId: z.string().min(1).max(40),
        optionId: z.string().min(1).max(30),
      })
      .strict()
      .parse(req.body);
    res.json(
      await changeAttempt(req, (a, course) => {
        const recorded = a.activityAnswers.find(
          (x) => x.taskId === input.taskId,
        );
        if (recorded) return { feedback: taskFeedback(recorded, course) };
        if (a.phase !== "activity")
          fail(409, "This activity is no longer accepting responses.");
        const hunt = course.type === "hunt";
        const task = hunt
          ? course.tasks.find((t) => t.id === input.taskId)
          : course.tasks[a.activityAnswers.length];
        if (!task) fail(404, "Hazard response not found.");
        const identification = hunt
          ? a.classifications.find((x) => x.objectId === task.objectId)
          : null;
        if (hunt && !identification)
          fail(409, "Classify the area before choosing a control.");
        if (input.taskId !== task.id || !a.inspected.includes(task.objectId))
          fail(409, "Inspect the current checkpoint before answering.");
        if (!task.options.some((o) => o.id === input.optionId))
          fail(422, "Choose one of the displayed responses.");
        const answer = {
          taskId: task.id,
          optionId: input.optionId,
          correct: input.optionId === task.correctId,
          ...(hunt
            ? {
                identificationCorrect:
                  identification.correct && identification.flagged,
              }
            : {}),
          answeredAt: new Date(),
        };
        a.activityAnswers.push(answer);
        a.selectedTaskId = null;
        finishActivityIfComplete(a, course);
        return { feedback: taskFeedback(answer, course) };
      }),
    );
  });
  router.post("/attempts/:id/quiz/next", async (req, res) => {
    const { afterQuestionId } = z
      .object({ afterQuestionId: z.string().max(40).nullable() })
      .strict()
      .parse(req.body);
    res.json(
      await changeAttempt(req, (a, course) => {
        if ((a.quizAnswers.at(-1)?.questionId || null) !== afterQuestionId)
          return {};
        if (a.phase === "quiz" || a.phase === "completed") return {};
        if (!["quiz-ready", "feedback"].includes(a.phase))
          fail(
            409,
            course.type === "hunt"
              ? "Review all eight areas and respond to all five hazards before starting the quiz."
              : "Finish all five practical checkpoints before starting the quiz.",
          );
        a.phase = "quiz";
        a.questionStartedAt = new Date();
        a.questionDeadline = new Date(
          a.questionStartedAt.getTime() + QUIZ_SECONDS * 1000,
        );
        return {};
      }),
    );
  });
  router.post("/attempts/:id/quiz/answer", async (req, res) => {
    const input = z
      .object({
        questionId: z.string().min(1).max(40),
        optionId: z.string().max(30).nullable(),
        timeout: z.boolean().optional(),
      })
      .strict()
      .parse(req.body);
    res.json(
      await changeAttempt(req, (a, course) => {
        const recorded = a.quizAnswers.find(
          (x) => x.questionId === input.questionId,
        );
        if (recorded) return { feedback: quizFeedback(recorded, course) };
        if (
          a.phase !== "quiz" ||
          input.questionId !== a.quizOrder[a.quizAnswers.length]
        )
          fail(409, "This is not the current question. Reload to continue.");
        // A slightly early client countdown must not score a timeout or restart time.
        // expireQuestion above is authoritative; only the server decides expiry.
        if (input.timeout) {
          if (input.optionId !== null)
            fail(422, "A timeout check cannot contain an answer.");
          return {};
        }
        const q = course.questions.find((q) => q.id === input.questionId);
        if (
          input.optionId !== null &&
          !q.options.some((o) => o.id === input.optionId)
        )
          fail(422, "Choose one of the displayed answers.");
        const answer = {
          questionId: q.id,
          optionId: input.optionId,
          correct: input.optionId === q.correctId,
          timedOut: false,
          answeredAt: new Date(),
        };
        a.quizAnswers.push(answer);
        a.phase = "feedback";
        a.questionDeadline = null;
        a.questionStartedAt = null;
        finishIfComplete(a);
        return { feedback: quizFeedback(answer, course) };
      }),
    );
  });
  return router;
}

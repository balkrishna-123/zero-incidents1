import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import supertest from "supertest";
const temp = await mkdtemp(path.join(os.tmpdir(), "zi-height-api-"));
process.env.NODE_ENV = "test";
process.env.DEMO_MODE = "true";
process.env.DATA_DIR = temp;
process.env.SESSION_SECRET =
  "working-at-height-test-only-not-a-production-secret";
const { connectDatabase, disconnectDatabase } = await import("../server/db.js");
const { createApp } = await import("../server/app.js");
const { seedDatabase } = await import("../server/seed.js");
const { User, Progress } = await import("../server/models.js");
const { TrainingAttempt } = await import("../server/training-models.js");
const { COURSES } = await import("../server/training-content.js");
const { hashPassword } = await import("../server/passwords.js");
const course = COURSES["working-at-height"];
function client(app) {
  const agent = supertest.agent(app);
  let csrf;
  return {
    agent,
    async login(username, password) {
      csrf = (await agent.get("/api/session").expect(200)).body.csrfToken;
      const r = await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrf)
        .send({ username, password })
        .expect(200);
      csrf = r.body.csrfToken;
      return r;
    },
    get: (u) => agent.get("/api" + u),
    post: (u, body) =>
      agent
        .post("/api" + u)
        .set("X-CSRF-Token", csrf)
        .send(body),
    patch: (u, body) =>
      agent
        .patch("/api" + u)
        .set("X-CSRF-Token", csrf)
        .send(body),
    delete: (u, body) =>
      agent
        .delete("/api" + u)
        .set("X-CSRF-Token", csrf)
        .send(body),
  };
}
const pathFor = (id) => `/training/attempts/${id}`;
async function practical(c, id, correct = () => true) {
  for (const [i, t] of course.tasks.entries()) {
    await c
      .post(pathFor(id) + "/inspect", { objectId: t.objectId })
      .expect(200);
    const optionId = correct(i)
      ? t.correctId
      : t.options.find((o) => o.id !== t.correctId).id;
    await c
      .post(pathFor(id) + "/activity-answer", { taskId: t.id, optionId })
      .expect(200);
  }
}
async function quiz(c, id, correct = () => true) {
  let state = (await c.get(pathFor(id)).expect(200)).body;
  for (let i = 0; i < 5; i++) {
    state = (
      await c
        .post(pathFor(id) + "/quiz/next", {
          afterQuestionId: state.attempt.lastQuizQuestionId,
        })
        .expect(200)
    ).body;
    const q = course.questions.find(
      (q) => q.id === state.attempt.currentQuestion.id,
    );
    state = (
      await c
        .post(pathFor(id) + "/quiz/answer", {
          questionId: q.id,
          optionId: correct(i) ? q.correctId : null,
        })
        .expect(200)
    ).body;
  }
  return state;
}
test(
  "Working at Height: complete, server-marked and resumable learning flow",
  { timeout: 180000 },
  async (t) => {
    const uri = await connectDatabase({ isolated: true });
    await seedDatabase();
    const app = await createApp(uri);
    t.after(async () => {
      await app.locals.sessionStore.close();
      await disconnectDatabase();
      await rm(temp, { recursive: true, force: true });
    });
    const hash = await hashPassword("ModuleTest!2026");
    const user = await User.create({
      firstName: "Module",
      lastName: "Tester",
      age: 26,
      username: "module.tester",
      role: "employee",
      status: "active",
      passwordHash: hash,
      mustChangePassword: false,
    });
    await User.create({
      firstName: "Other",
      lastName: "Learner",
      age: 26,
      username: "other.learner",
      role: "employee",
      passwordHash: hash,
      mustChangePassword: false,
    });
    const learner = client(app),
      other = client(app),
      admin = client(app),
      pending = client(app);
    await learner.login("module.tester", "ModuleTest!2026");
    await other.login("other.learner", "ModuleTest!2026");
    await admin.login("safety.admin", "ZeroIncident!2026");
    await pending.login("ramesh.s", "Welcome!2026");
    let id;
    const manualCourse = COURSES["manual-handling"];
    const legacyDate = new Date("2026-09-01T09:00:00Z");
    // A saved 1.2-format Manual Handling result, with no new fields/migration.
    const legacy = await TrainingAttempt.create({
      employeeId: user._id,
      moduleKey: "manual-handling",
      version: "warehouse-2026-v1",
      inspected: manualCourse.objects.map((o) => o.id),
      phase: "completed",
      open: false,
      activityAnswers: manualCourse.tasks.map((t) => ({
        taskId: t.id,
        optionId: t.correctId,
        correct: true,
        answeredAt: legacyDate,
      })),
      quizOrder: manualCourse.questions.slice(0, 5).map((q) => q.id),
      optionOrders: Object.fromEntries(
        [...manualCourse.tasks, ...manualCourse.questions].map((q) => [
          q.id,
          q.options.map((o) => o.id),
        ]),
      ),
      quizAnswers: manualCourse.questions.slice(0, 5).map((q, i) => ({
        questionId: q.id,
        optionId: i ? q.correctId : null,
        correct: i > 0,
        timedOut: i === 0,
        answeredAt: legacyDate,
      })),
      activityScore: 70,
      quizScore: 24,
      score: 94,
      completedAt: legacyDate,
      recordedAt: legacyDate,
    });
    await Progress.create({
      employeeId: user._id,
      moduleKey: "manual-handling",
      source: "assessment",
      score: 94,
      activityScore: 70,
      quizScore: 24,
      attempts: 1,
      bestAttemptId: legacy._id,
      assessedAt: legacyDate,
      lastScore: 94,
      lastAssessedAt: legacyDate,
    });
    let manualOpen;
    await t.test(
      "legacy Manual Handling history and best are readable without a migration",
      async () => {
        const old = (await learner.get(pathFor(legacy._id)).expect(200)).body;
        assert.equal(old.attempt.moduleKey, "manual-handling");
        assert.equal(old.attempt.result.score, 94);
        assert.equal(old.attempt.result.review.length, 10);
        assert.equal(old.attempt.completedAt, legacyDate.toISOString());
        assert.match(old.attempt.result.review[0].title, /load/i);
        manualOpen = (
          await learner
            .post("/training/manual-handling/start", { acknowledged: true })
            .expect(200)
        ).body.attempt.id;
        assert.equal(
          (await learner.get(pathFor(manualOpen))).body.bestScore,
          94,
        );
      },
    );
    await t.test(
      "only ready employees can use the module; answers and unreleased modules stay private",
      async () => {
        await supertest(app).get("/api/training/working-at-height").expect(401);
        await admin.get("/training/working-at-height").expect(403);
        await pending.get("/training/working-at-height").expect(403);
        await learner.agent
          .post("/api/training/working-at-height/start")
          .send({ acknowledged: true })
          .expect(403);
        const meta = (
          await learner.get("/training/working-at-height").expect(200)
        ).body;
        assert.equal(meta.course.activityMax, 70);
        assert.equal(meta.course.quizMax, 30);
        assert.equal(meta.course.quizSeconds, 20);
        assert.equal(meta.course.objects.length, 5);
        assert.equal(meta.trainer.nickname, "Yeti");
        assert.equal(JSON.stringify(meta).includes("correctId"), false);
        assert.equal(meta.course.questions, undefined);
        await learner.get("/training/unsafe-acts").expect(404);
        await learner
          .post("/training/unsafe-acts/start", { acknowledged: true })
          .expect(404);
        const hub = (await learner.get("/me/training")).body;
        assert.equal(
          hub.modules.filter((m) => m.assessmentAvailable).length,
          3,
        );
        await learner
          .post("/training/working-at-height/start", { acknowledged: false })
          .expect(422);
      },
    );
    await t.test(
      "one resumable attempt, ordered inspection and no client-supplied score",
      async () => {
        const start = await Promise.all([
          learner.post("/training/working-at-height/start", {
            acknowledged: true,
          }),
          learner.post("/training/working-at-height/start", {
            acknowledged: true,
          }),
        ]);
        start.forEach((r) => assert.equal(r.status, 200));
        id = start[0].body.attempt.id;
        assert.equal(start[1].body.attempt.id, id);
        assert.equal(
          await TrainingAttempt.countDocuments({
            employeeId: user._id,
            moduleKey: "working-at-height",
            open: true,
          }),
          1,
        );
        await other.get(pathFor(id)).expect(404);
        await other
          .post(pathFor(id) + "/inspect", { objectId: "ground-tool" })
          .expect(404);
        await learner
          .post(pathFor(id) + "/quiz/next", { afterQuestionId: null })
          .expect(409);
        await learner
          .post(pathFor(id) + "/inspect", { objectId: "platform" })
          .expect(409);
        await learner
          .post(pathFor(id) + "/activity-answer", {
            taskId: "wh-ground",
            optionId: "choice-2",
          })
          .expect(409);
        const inspected = (
          await learner
            .post(pathFor(id) + "/inspect", { objectId: "ground-tool" })
            .expect(200)
        ).body;
        assert.equal(inspected.attempt.task.id, "wh-ground");
        assert.equal(JSON.stringify(inspected).includes("correctId"), false);
        await learner
          .post(pathFor(id) + "/activity-answer", {
            taskId: "wh-ground",
            optionId: "choice-2",
            score: 100,
          })
          .expect(422);
        const active = (await learner.get("/me/training")).body.activeTraining;
        assert.equal(active["working-at-height"].id, id);
        assert.equal(active["manual-handling"].id, manualOpen);
      },
    );
    await t.test(
      "first practical response is immutable, including concurrent duplicate clicks",
      async () => {
        const first = course.tasks[0];
        const wrong = first.options.find((o) => o.id !== first.correctId).id;
        const duplicate = await Promise.all([
          learner.post(pathFor(id) + "/activity-answer", {
            taskId: first.id,
            optionId: wrong,
          }),
          learner.post(pathFor(id) + "/activity-answer", {
            taskId: first.id,
            optionId: first.correctId,
          }),
        ]);
        duplicate.forEach((r) => assert.equal(r.status, 200));
        const saved = await TrainingAttempt.findById(id);
        assert.equal(saved.activityAnswers.length, 1);
        // Whichever request arrived first is the sole recorded response.
        const original = saved.activityAnswers[0].correct;
        await learner
          .post(pathFor(id) + "/activity-answer", {
            taskId: first.id,
            optionId: first.correctId,
          })
          .expect(200);
        assert.equal(
          (await TrainingAttempt.findById(id)).activityAnswers[0].correct,
          original,
        );
        // Reset this fixture's one answer to an explicitly wrong first response for deterministic arithmetic below.
        await TrainingAttempt.updateOne(
          { _id: id },
          {
            $set: {
              "activityAnswers.0.correct": false,
              "activityAnswers.0.optionId": wrong,
            },
          },
        );
        for (const task of course.tasks.slice(1)) {
          await learner
            .post(pathFor(id) + "/inspect", { objectId: task.objectId })
            .expect(200);
          await learner
            .post(pathFor(id) + "/activity-answer", {
              taskId: task.id,
              optionId: task.correctId,
            })
            .expect(200);
        }
        assert.equal(
          (await learner.get(pathFor(id))).body.attempt.phase,
          "quiz-ready",
        );
      },
    );
    await t.test(
      "20-second server deadlines survive reloads; early and late timeout requests cannot cheat",
      async () => {
        const s = (
          await learner
            .post(pathFor(id) + "/quiz/next", { afterQuestionId: null })
            .expect(200)
        ).body;
        const q = s.attempt.currentQuestion;
        const stored = await TrainingAttempt.findById(id);
        assert.equal(
          stored.questionDeadline - stored.questionStartedAt >= 20000,
          true,
        );
        assert.equal(
          stored.questionDeadline - stored.questionStartedAt < 20030,
          true,
        );
        const early = (
          await learner
            .post(pathFor(id) + "/quiz/answer", {
              questionId: q.id,
              optionId: null,
              timeout: true,
            })
            .expect(200)
        ).body;
        assert.equal(early.attempt.phase, "quiz");
        assert.equal(early.attempt.currentQuestion.deadline, q.deadline);
        const reload = (await learner.get(pathFor(id)).expect(200)).body;
        assert.equal(reload.attempt.currentQuestion.deadline, q.deadline);
        const same = (
          await learner
            .post(pathFor(id) + "/quiz/next", { afterQuestionId: null })
            .expect(200)
        ).body;
        assert.equal(same.attempt.currentQuestion.deadline, q.deadline);
        await TrainingAttempt.updateOne(
          { _id: id },
          { $set: { questionDeadline: new Date(Date.now() - 10) } },
        );
        const late = (
          await learner
            .post(pathFor(id) + "/quiz/answer", {
              questionId: q.id,
              optionId: course.questions.find((x) => x.id === q.id).correctId,
            })
            .expect(200)
        ).body;
        assert.equal(late.feedback.timedOut, true);
        assert.equal(late.feedback.points, 0);
        assert.equal(late.attempt.quizDone, 1);
        for (let n = 1; n < 5; n++) {
          const state = (await learner.get(pathFor(id))).body;
          const next = (
            await learner
              .post(pathFor(id) + "/quiz/next", {
                afterQuestionId: state.attempt.lastQuizQuestionId,
              })
              .expect(200)
          ).body;
          const current = course.questions.find(
            (q) => q.id === next.attempt.currentQuestion.id,
          );
          await learner
            .post(pathFor(id) + "/quiz/answer", {
              questionId: current.id,
              optionId: current.correctId,
            })
            .expect(200);
        }
        const final = (await learner.get(pathFor(id))).body;
        assert.equal(final.attempt.result.activityScore, 56);
        assert.equal(final.attempt.result.quizScore, 24);
        assert.equal(final.attempt.result.score, 80);
        assert.equal(final.attempt.result.passed, true);
        assert.equal(final.attempt.result.stars, 2);
        assert.equal(final.attempt.result.review.length, 10);
        const progress = (await learner.get("/me/training")).body.progress;
        assert.equal(progress.modules[1].score, 80);
        assert.equal(progress.modules[1].source, "assessment");
        assert.equal(progress.eligible, false);
        const detail = (
          await admin.get(`/admin/employees/${user._id}`).expect(200)
        ).body;
        assert.equal(detail.progress.modules[1].activityScore, 56);
        assert.equal(detail.progress.modules[1].quizScore, 24);
      },
    );
    await t.test(
      "the two modules cannot overwrite each other's answers, open attempts or progress",
      async () => {
        const stillOpen = (await learner.get(pathFor(manualOpen)).expect(200))
          .body;
        assert.equal(stillOpen.attempt.phase, "activity");
        assert.equal(stillOpen.attempt.activityDone, 0);
        assert.equal(stillOpen.bestScore, 94);
        await learner
          .post(pathFor(manualOpen) + "/inspect", { objectId: "ground-tool" })
          .expect(409);
        await learner
          .post(pathFor(manualOpen) + "/activity-answer", {
            taskId: "wh-ground",
            optionId: "choice-2",
          })
          .expect(409);
        const original = await Progress.findOne({
          employeeId: user._id,
          moduleKey: "manual-handling",
        }).lean();
        assert.equal(String(original.bestAttemptId), String(legacy._id));
        assert.equal(original.score, 94);
        assert.equal(original.attempts, 1);
        const report = (await learner.get("/me/training")).body;
        assert.equal(report.progress.passed, 2);
        assert.equal(report.progress.eligible, false);
        assert.equal(report.progress.overallScore, null);
        assert.equal(report.activeTraining["manual-handling"].id, manualOpen);
        assert.equal(report.activeTraining["working-at-height"], undefined);
      },
    );
    await t.test(
      "retakes preserve best, improve best, and 70 is a pass; other modules remain untouched",
      async () => {
        for (const [activityCorrect, quizCorrect, expected] of [
          [false, false, 0],
          [true, true, 100],
          [true, false, 70],
        ]) {
          const s = (
            await learner
              .post("/training/working-at-height/start", { acknowledged: true })
              .expect(200)
          ).body;
          await practical(learner, s.attempt.id, () => activityCorrect);
          const end = await quiz(learner, s.attempt.id, () => quizCorrect);
          assert.equal(end.attempt.result.score, expected);
          assert.equal(end.attempt.result.passed, expected >= 70);
          assert.equal(end.bestScore, expected === 0 ? 80 : 100);
        }
        const records = await Progress.find({
          employeeId: user._id,
          moduleKey: "working-at-height",
        }).lean();
        assert.equal(records.length, 1);
        assert.equal(records[0].score, 100);
        assert.equal(records[0].attempts, 4);
        assert.equal(records[0].lastScore, 70);
        assert.equal(
          (await learner.get("/training/working-at-height")).body.history
            .length,
          4,
        );
        const certificateState = (
          await learner.get("/me/certificate").expect(200)
        ).body;
        assert.equal(certificateState.certificate, null);
        await learner.get("/me/certificate/pdf").expect(409);
      },
    );
    await t.test(
      "demonstration marks cannot override a genuine first assessment",
      async () => {
        const demo = client(app);
        await demo.login("anisha.g", "DemoOnly!2026");
        const s = (
          await demo
            .post("/training/working-at-height/start", { acknowledged: true })
            .expect(200)
        ).body;
        await practical(demo, s.attempt.id, () => false);
        const end = await quiz(demo, s.attempt.id, () => false);
        assert.equal(end.bestScore, 0);
        const p = (await demo.get("/me/training")).body.progress;
        assert.equal(p.modules[1].score, 0);
        assert.equal(p.modules[1].source, "assessment");
        assert.equal(p.modules[1].attempts, 1);
        assert.equal(p.modules[0].source, "demo");
        assert.equal(p.eligible, false);
      },
    );
    await t.test(
      "deactivation revokes access, reactivation preserves results, deletion removes attempts",
      async () => {
        await admin
          .patch(`/admin/employees/${user._id}/status`, { status: "inactive" })
          .expect(200);
        await learner.get(pathFor(id)).expect(401);
        await admin
          .patch(`/admin/employees/${user._id}/status`, { status: "active" })
          .expect(200);
        await learner.login("module.tester", "ModuleTest!2026");
        assert.equal(
          (await learner.get("/me/training")).body.progress.modules[1].score,
          100,
        );
        await admin
          .delete(`/admin/employees/${user._id}`, {
            confirmation: "module.tester",
          })
          .expect(200);
        assert.equal(
          await TrainingAttempt.countDocuments({ employeeId: user._id }),
          0,
        );
        assert.equal(
          await Progress.countDocuments({ employeeId: user._id }),
          0,
        );
        await learner.get("/training/working-at-height").expect(401);
      },
    );
  },
);

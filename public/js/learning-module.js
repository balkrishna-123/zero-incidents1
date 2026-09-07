import { icon } from "./icons.js";
import { esc, notify, formatDate } from "./ui.js";
import { MODULE_VIEWS } from "./module-views.js";

const starRow = (n) =>
  `<span class="training-stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => `<span class="${i <= n ? "earned" : ""}" aria-hidden="true">★</span>`).join("")}</span>`;
const source = (ref) =>
  `<a class="training-source" href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)} ${icon("arrow", 12)}</a>`;

export async function learningModulePage(
  ctx,
  moduleKey,
  requestedAttempt = null,
) {
  const view = MODULE_VIEWS[moduleKey];
  if (!view) throw new Error("This training module is not available.");
  const data = await ctx.api.get(`/training/${moduleKey}`);
  const c = data.course;
  const guideName = data.trainer?.nickname || "Your safety guide";
  const guideImage = data.trainer
    ? `<img src="${esc(data.trainer.imageUrl)}" alt="${esc(guideName)}, your virtual trainer">`
    : `<span class="training-guide-icon">${icon("shield", 23)}</span>`;
  return {
    title: c.title,
    html: `<div class="learning-module ${moduleKey === "manual-handling" ? "manual-training" : "height-training"}" data-training-module data-course="${esc(moduleKey)}">
      <a href="#/employee/hub" class="training-back">${icon("arrow", 14)} Back to training hub</a>
      <header class="training-heading"><div class="training-heading-title"><span class="training-module-icon">${icon(view.icon, 24)}</span><div><div class="page-eyebrow">MODULE ${view.number} · ${esc(c.zone.toUpperCase())}</div><h1>${esc(c.title)}</h1><p>${esc(c.subtitle)}</p></div></div><span class="training-save-status">${icon("shield", 13)} <span data-save-label>Progress saves automatically</span></span></header>
      <ol class="training-steps" aria-label="Module stages"><li data-step="intro"><span>01</span> Briefing</li><li data-step="activity"><span>02</span> Practical activity <small>70 marks</small></li><li data-step="quiz"><span>03</span> Knowledge check <small>30 marks</small></li><li data-step="result"><span>04</span> Your result</li></ol>
      <div class="training-error" role="alert" hidden><span data-error-text></span><button class="btn btn-secondary btn-small" data-reconnect>Reconnect</button></div>
      <div class="training-workspace" data-activity-layout>
        <section class="warehouse-frame" aria-label="Interactive warehouse"><header class="warehouse-topline"><span><i></i> ${esc(c.zone.toUpperCase())} <small>${view.number}</small></span><span class="scene-360">360° INTERACTIVE</span></header><div class="warehouse-view" data-warehouse><div class="scene-loading">${icon(view.icon, 28)}<span>Preparing the ${esc(c.zone.toLowerCase())}…</span></div></div><div class="warehouse-controls"><span>${icon("eye", 14)} Drag to look · click a marker</span><div><button type="button" data-look="left" title="Look left" aria-label="Look left">←</button><button type="button" data-look="right" title="Look right" aria-label="Look right">→</button><button type="button" data-look="in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-look="out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-look="reset" title="Locate the current checkpoint" aria-label="Locate the current checkpoint">${icon("refresh", 14)}</button></div></div><div class="warehouse-footnote">Use arrow keys while the scene is focused, or use the scene checkpoints below.</div></section>
        <aside class="training-side panel"><div class="training-coach">${guideImage}<div><strong>${esc(guideName)}</strong><small>YOUR SAFETY GUIDE</small></div><span class="coach-dot"></span></div><div class="lesson-panel" data-lesson-panel></div></aside>
      </div>
      <section class="scene-checkpoints panel" data-checkpoints aria-label="Accessible scene checkpoints"><header><div><h2>Scene checkpoints</h2><p>These controls provide the same activity without dragging the 3D view.</p></div><span data-checkpoint-count>0 / 5</span></header><div class="checkpoint-list">${c.objects.map((o, i) => `<div class="checkpoint" data-checkpoint="${o.id}"><span class="checkpoint-index">${i + 1}</span><strong>${esc(o.label)}</strong><button type="button" data-focus-object="${o.id}" aria-label="Locate ${esc(o.label)} in the scene">Locate</button><button type="button" data-inspect-object="${o.id}">Inspect</button></div>`).join("")}</div></section>
      <div class="training-assessment" data-assessment hidden></div>
      <div class="training-foundations" data-foundations>${view.primer}<details class="training-references"><summary>Sources, scope and important safety information</summary><p>${esc(c.notice)}</p><p>The learner should follow a competent workplace assessment, equipment instructions and the employer’s procedures. ${esc(view.scope)}</p><div>${c.references.map(source).join("")}</div></details></div>
      <section class="panel training-history" data-history-panel ${data.history.length ? "" : "hidden"}><header class="panel-head"><div><h2>Your previous attempts</h2><p>Real assessment history. Your best assessed score is retained.</p></div>${icon("clock", 18)}</header><div data-history-list></div></section>
      <div class="training-announcement sr-only" aria-live="polite" data-announcement></div>
    </div>`,
    mount(root) {
      const wrap = root.querySelector("[data-training-module]");
      const lesson = wrap.querySelector("[data-lesson-panel]");
      const assessment = wrap.querySelector("[data-assessment]");
      const warehouse = wrap.querySelector("[data-warehouse]");
      const errorBox = wrap.querySelector(".training-error");
      let alive = true,
        busy = false,
        attempt = null,
        scene = null,
        heldFeedback = null,
        clock = null,
        autoAdvance = null;
      let offset = 0,
        expirySent = false,
        bestScore = data.bestScore,
        history = [...data.history];
      let sceneUnavailable = false;
      const attemptPath = () => `/training/attempts/${attempt.id}`;
      const announce = (text) => {
        if (alive) wrap.querySelector("[data-announcement]").textContent = text;
      };
      const clearTimers = () => {
        clearInterval(clock);
        clock = null;
        clearTimeout(autoAdvance);
        autoAdvance = null;
      };
      const status = (text) => {
        wrap.querySelector("[data-save-label]").textContent = text;
      };
      function showError(e) {
        if (!alive) return;
        wrap.querySelector("[data-error-text]").textContent =
          e.status === 0
            ? "Connection lost. Saved responses are kept; an active question timer continues. Reconnect to recover the current state."
            : e.message;
        errorBox.hidden = false;
        status("Check connection");
      }
      async function action(
        path,
        body,
        { get = false, feedback = false } = {},
      ) {
        if (busy || !alive) return;
        busy = true;
        errorBox.hidden = true;
        status("Saving…");
        setDisabled(true);
        const sent = Date.now();
        try {
          let response;
          try {
            response = get
              ? await ctx.api.get(path)
              : await ctx.api.post(path, body);
          } catch (error) {
            if (error.code !== "CSRF_INVALID") throw error;
            await ctx.refreshSession();
            response = get
              ? await ctx.api.get(path)
              : await ctx.api.post(path, body);
          }
          if (!alive) return;
          offset = response.serverNow + (Date.now() - sent) / 2 - Date.now();
          if (response.attempt?.moduleKey !== moduleKey) {
            throw new Error(
              "This attempt belongs to a different module. Return to the training hub and open the matching module.",
            );
          }
          attempt = response.attempt;
          bestScore = response.bestScore;
          if (attempt) historyReplace(attempt.id);
          heldFeedback = feedback
            ? response.feedback || attempt.lastFeedback
            : null;
          status("All responses saved");
          expirySent = false;
          render();
        } catch (error) {
          showError(error);
        } finally {
          busy = false;
          if (alive) setDisabled(false);
        }
      }
      function historyReplace(id) {
        window.history.replaceState(
          null,
          "",
          `#/employee/module/${moduleKey}?attempt=${encodeURIComponent(id)}`,
        );
      }
      function setDisabled(value) {
        wrap
          .querySelectorAll(
            "[data-start-training], [data-activity-option], [data-quiz-option], [data-quiz-next], [data-inspect-object], [data-retry-training], [data-history-id], [data-quiz-skip]",
          )
          .forEach((b) => {
            b.disabled =
              value ||
              (b.hasAttribute("data-start-training") &&
                !wrap.querySelector("#training-ack")?.checked);
          });
      }
      function feedbackHTML(f, nextLabel, extraClass = "") {
        return `<section class="decision-feedback ${f.correct ? "correct" : "needs-review"} ${extraClass}" data-feedback><span class="feedback-mark">${icon(f.correct ? "checkCircle" : "info", 22)}</span><div class="feedback-eyebrow">${f.timedOut ? "TIME EXPIRED" : f.correct ? "SAFER DECISION" : "LET’S REVIEW"}</div><h2>${f.correct ? "Well done." : f.timedOut ? "Time’s up." : "A safer choice is available."}</h2><span class="feedback-points">${f.points} / ${f.kind === "quiz" ? 6 : 14} marks</span>${!f.correct ? `<div class="correct-response"><strong>Safer response</strong><p>${esc(f.correctAnswer)}</p></div>` : ""}<p>${esc(f.explanation)}</p>${f.kind === "activity" ? '<p class="lesson-small">The scene now shows the safer arrangement for learning. Marks remain based on your first response.</p>' : ""}${source(f.reference)}<button class="btn btn-primary training-next" data-feedback-next>${nextLabel} ${icon("arrow", 15)}</button>${f.timedOut ? '<div class="auto-next-note">Continuing automatically in a moment. <button type="button" data-pause-auto>Pause to read</button></div>' : ""}</section>`;
      }
      function setStage(stage) {
        const stages = ["intro", "activity", "quiz", "result"];
        wrap.querySelectorAll("[data-step]").forEach((el) => {
          el.classList.toggle("is-current", el.dataset.step === stage);
          el.classList.toggle(
            "is-done",
            stages.indexOf(el.dataset.step) < stages.indexOf(stage),
          );
          if (el.dataset.step === stage)
            el.setAttribute("aria-current", "step");
          else el.removeAttribute("aria-current");
        });
      }
      function renderHistory() {
        const h = wrap.querySelector("[data-history-panel]");
        h.hidden = !history.length;
        wrap.querySelector("[data-history-list]").innerHTML = history
          .map(
            (a) =>
              `<div class="attempt-history-row"><span>${formatDate(a.completedAt)}</span><strong>${a.score}/100</strong><span class="badge ${a.passed ? "green" : "amber"}">${a.classification}</span><button class="btn btn-secondary btn-small" data-history-id="${esc(a.id)}">Review result</button></div>`,
          )
          .join("");
      }
      function render() {
        if (!alive) return;
        clearTimers();
        const activityShown =
          !attempt ||
          ["activity", "quiz-ready"].includes(attempt.phase) ||
          heldFeedback?.kind === "activity";
        wrap.querySelector("[data-activity-layout]").hidden = !activityShown;
        wrap.querySelector("[data-checkpoints]").hidden = !activityShown;
        wrap.querySelector("[data-foundations]").hidden = !activityShown;
        assessment.hidden = activityShown;
        scene?.setVisible(activityShown);
        scene?.update(
          attempt?.activityAnswers || [],
          attempt?.nextTask?.objectId || c.objects[0].id,
        );
        const done = attempt?.activityDone || 0;
        wrap.querySelector("[data-checkpoint-count]").textContent =
          `${done} / 5`;
        wrap.querySelectorAll("[data-checkpoint]").forEach((el) => {
          const a = attempt?.activityAnswers.find(
            (a) => a.objectId === el.dataset.checkpoint,
          );
          el.classList.toggle(
            "checkpoint-current",
            Boolean(attempt?.nextTask?.objectId === el.dataset.checkpoint),
          );
          el.classList.toggle("checkpoint-done", Boolean(a));
          el.querySelector("[data-inspect-object]").textContent = a
            ? a.correct
              ? "✓ 14 marks"
              : "Reviewed · 0"
            : "Inspect";
          el.querySelector("[data-inspect-object]").hidden = Boolean(a);
        });
        if (!attempt) {
          setStage("intro");
          lesson.innerHTML = `<div class="lesson-eyebrow">YOUR MISSION</div><h2>${esc(view.missionTitle)}</h2>${data.trainer?.introduction ? `<details class="trainer-welcome"><summary>A welcome from ${esc(guideName)}</summary><p>${esc(data.trainer.introduction)}</p></details>` : ""}<p>${esc(view.mission)}</p>${view.briefNote ? `<p class="height-brief-note">${esc(view.briefNote)}</p>` : ""}<div class="lesson-score-split"><div><strong>70</strong><span>Activity marks</span></div><div><strong>30</strong><span>Quiz marks</span></div><div><strong>70%</strong><span>To pass</span></div></div><ul class="training-briefing"><li>Explore the scene and inspect five checkpoints in order.</li><li>Your first choice counts. Read the feedback after each decision.</li><li>Finish with five questions: 20 seconds per question.</li><li>Progress is saved on the server. You can resume or retake.</li></ul>${bestScore !== null ? `<div class="training-best">Your assessed best: <strong>${bestScore}/100</strong></div>` : ""}<label class="training-ack"><input type="checkbox" id="training-ack"><span>I’ve read the briefing. I understand this simulation does not replace workplace instruction.</span></label><button class="btn btn-primary training-start" data-start-training disabled>Start practical activity ${icon("arrow", 15)}</button>`;
        } else if (heldFeedback) {
          setStage(heldFeedback.kind === "activity" ? "activity" : "quiz");
          const isLast = attempt.phase === "completed";
          const html = feedbackHTML(
            heldFeedback,
            isLast
              ? "View my result"
              : heldFeedback.kind === "activity"
                ? attempt.phase === "quiz-ready"
                  ? "Continue to quiz"
                  : "Next checkpoint"
                : "Next question",
          );
          if (heldFeedback.kind === "activity") lesson.innerHTML = html;
          else
            assessment.innerHTML = `<div class="quiz-focus-card panel">${html}</div>`;
          if (heldFeedback.timedOut)
            autoAdvance = setTimeout(advanceFeedback, 3500);
        } else if (attempt.phase === "activity") {
          setStage("activity");
          if (!attempt.task) {
            const t = attempt.nextTask;
            lesson.innerHTML = `<div class="lesson-eyebrow">CHECKPOINT ${t.number} OF 5</div><h2>${esc(t.title)}</h2><div class="lesson-progress"><i style="width:${done * 20}%"></i></div><p>Find the highlighted checkpoint in the ${esc(c.zone.toLowerCase())}. Inspect it, then choose the safest response.</p><div class="checkpoint-cue"><span>${t.number}</span><div><strong>${esc(c.objects.find((o) => o.id === t.objectId).label)}</strong><small>One decision · 14 marks</small></div></div><button class="btn btn-primary training-start" data-inspect-object="${t.objectId}">Inspect checkpoint ${icon("eye", 15)}</button><button class="btn btn-secondary training-start" data-focus-object="${t.objectId}">Locate in 3D ${icon("arrow", 15)}</button><p class="lesson-small">The activity is untimed. ${esc(view.studyHint)}</p>`;
          } else {
            const t = attempt.task;
            lesson.innerHTML = `<div class="lesson-eyebrow">CHECKPOINT ${done + 1} OF 5 · 14 MARKS</div><h2>${esc(t.title)}</h2><p class="task-prompt">${esc(t.prompt)}</p><div class="activity-options">${t.options.map((o, i) => `<button class="training-choice" data-activity-option="${o.id}"><span>${String.fromCharCode(65 + i)}</span><div>${esc(o.text)}</div></button>`).join("")}</div><p class="lesson-small">Selecting a response records it immediately. Your first choice counts.</p>`;
          }
        } else if (attempt.phase === "quiz-ready") {
          setStage("quiz");
          const points =
            attempt.activityAnswers.filter((x) => x.correct).length * 14;
          lesson.innerHTML = `<div class="lesson-eyebrow">ACTIVITY COMPLETE</div><h2>Ready to check your knowledge?</h2><div class="activity-total"><strong>${points}<small>/70</small></strong><span>Activity marks earned</span></div><p>Five questions, worth 6 marks each. You have <strong>20 seconds per question</strong>. Choose an answer to submit it.</p><p>At zero, an unanswered question earns no marks and the quiz continues after a short explanation. Reloading or switching tabs does not reset the timer.</p><button class="btn btn-primary training-start" data-quiz-next>Start timed quiz ${icon("arrow", 15)}</button><p class="lesson-small">The timer starts only when you press this button. You can read feedback between questions.</p>`;
        } else if (attempt.phase === "quiz") {
          setStage("quiz");
          renderQuestion();
        } else if (attempt.phase === "feedback") {
          heldFeedback = attempt.lastFeedback;
          render();
          return;
        } else if (attempt.phase === "completed") {
          setStage("result");
          renderResult();
        }
        renderHistory();
      }
      function renderQuestion() {
        const q = attempt.currentQuestion;
        assessment.innerHTML = `<div class="quiz-focus-card panel"><div class="quiz-top"><span>KNOWLEDGE CHECK <strong>${q.number} / 5</strong></span><div class="quiz-timer" role="timer" aria-label="Time remaining">${icon("clock", 18)}<strong data-countdown>20</strong><span>sec</span></div></div><div class="quiz-time-track"><i data-time-bar></i></div><div class="quiz-body"><span class="quiz-mark-note">6 MARKS · CHOOSE ONE RESPONSE</span><h2>${esc(q.prompt)}</h2><div class="quiz-options">${q.options.map((o, i) => `<button class="training-choice" data-quiz-option="${o.id}"><span>${String.fromCharCode(65 + i)}</span><div>${esc(o.text)}</div></button>`).join("")}</div><div class="quiz-bottom"><span>Your choice is submitted immediately.</span><button type="button" data-quiz-skip>Skip question</button></div></div></div><div class="quiz-guide-note">${guideImage}<p><strong>${esc(guideName)}</strong><span>Take a breath. Choose the response that reduces the risk.</span></p></div>`;
        let warned = false;
        const tick = () => {
          if (!alive || !attempt || attempt.currentQuestion?.id !== q.id)
            return;
          const milliseconds = Math.max(
            0,
            Date.parse(q.deadline) - (Date.now() + offset),
          );
          const seconds = Math.ceil(milliseconds / 1000);
          const number = assessment.querySelector("[data-countdown]");
          if (!number) return;
          number.textContent = seconds;
          assessment.querySelector("[data-time-bar]").style.width =
            `${milliseconds / 200}%`;
          assessment
            .querySelector(".quiz-timer")
            .classList.toggle("urgent", seconds <= 5);
          if (seconds <= 5 && !warned && seconds > 0) {
            warned = true;
            announce("Five seconds remaining.");
          }
          if (milliseconds <= 0 && !busy && !expirySent) {
            expirySent = true;
            action(
              attemptPath() + "/quiz/answer",
              { questionId: q.id, optionId: null, timeout: true },
              { feedback: true },
            );
          }
        };
        clock = setInterval(tick, 100);
        tick();
      }
      function renderResult() {
        const r = attempt.result;
        const priorPassRetained = !r.passed && bestScore >= 70;
        if (!history.some((h) => h.id === attempt.id))
          history.unshift({
            id: attempt.id,
            completedAt: attempt.completedAt,
            ...r,
          });
        assessment.innerHTML = `<div class="module-result" data-module-result><section class="result-summary panel"><span class="result-kicker">${esc(c.title.toUpperCase())} · RESULT SAVED</span><div class="result-ring ${r.passed ? "pass" : "retake"}" style="--result:${r.score}"><div><strong>${r.score}</strong><span>OUT OF 100</span></div></div>${starRow(r.stars)}<h2>${r.passed ? (r.score >= 85 ? "Excellent work." : "Module passed.") : "Let’s build on this."}</h2><span class="badge ${r.passed ? "green" : "amber"}">${priorPassRetained ? "Practice result" : r.classification} · ${r.passed ? "70+ achieved" : priorPassRetained ? "Earlier pass kept" : "Retake required"}</span><div class="result-breakdown"><div><span>Practical activity</span><strong>${r.activityScore}<small>/70</small></strong></div><div><span>Knowledge check</span><strong>${r.quizScore}<small>/30</small></strong></div></div><div class="training-best">Your assessed best: <strong>${bestScore}/100</strong></div><button class="btn btn-primary training-start" data-retry-training>${r.passed || priorPassRetained ? "Practise again" : "Retake module"} ${icon("refresh", 15)}</button><a class="btn btn-secondary training-start" href="#/employee/progress">View my progress ${icon("arrow", 15)}</a></section><section class="result-review panel"><div class="training-coach">${guideImage}<div><strong>${esc(guideName)}</strong><small>YOUR TRAINER’S FEEDBACK</small></div></div><div class="result-feedback"><h3>${r.passed ? "Keep making safer decisions." : "Review. Reassess. Try again."}</h3><p>${esc(priorPassRetained ? "This practice attempt was below the pass mark, but your earlier passing best still counts. Review the missed decisions and practise again whenever you are ready." : r.feedback)}</p><div class="result-scope">This is your ${esc(c.title)} result only. All three modules must be passed individually at 70/100 or higher. Manual Handling and Working at Height are playable; Hazard Perception and the final certificate flow are coming next. ${esc(view.scope)}</div><h3 class="review-title">Your decisions, explained</h3>${r.review.map((f, i) => `<details class="answer-review"><summary><span class="review-status ${f.correct ? "correct" : "incorrect"}">${icon(f.correct ? "checkCircle" : "info", 15)}</span><span>${i < 5 ? "Activity" : "Quiz"} ${i < 5 ? i + 1 : i - 4} · ${esc(f.title)}</span><strong>${f.points}/${f.kind === "activity" ? 14 : 6}</strong></summary><div><p><strong>Your response:</strong> ${esc(f.selected || (f.timedOut ? "Time expired" : "Skipped"))}</p><p><strong>Safer response:</strong> ${esc(f.correctAnswer)}</p><p>${esc(f.explanation)}</p>${source(f.reference)}</div></details>`).join("")}<p class="lesson-small">Stars: 3 for 85–100, 2 for 70–84, 1 for below 70 (retake required). Later retakes cannot reduce a genuine assessed best score. A sample score is not a real assessed best.</p></div></section></div>`;
        announce(
          `${c.title} result: ${r.score} out of 100. ${r.classification}.`,
        );
      }
      function advanceFeedback() {
        if (!alive || busy) return;
        clearTimeout(autoAdvance);
        const f = heldFeedback;
        heldFeedback = null;
        if (f?.kind === "quiz" && attempt.phase !== "completed") nextQuestion();
        else {
          render();
          if (attempt?.nextTask) scene?.focus(attempt.nextTask.objectId);
        }
      }
      function nextQuestion() {
        heldFeedback = null;
        action(attemptPath() + "/quiz/next", {
          afterQuestionId: attempt.lastQuizQuestionId,
        });
      }
      function inspect(id) {
        if (busy) return;
        if (!attempt) {
          scene?.focus(id);
          notify(
            "Read the briefing and start the activity to record your decisions.",
          );
          return;
        }
        if (attempt.activityAnswers.some((a) => a.objectId === id)) {
          scene?.focus(id);
          notify(
            "This checkpoint has already been recorded. Continue to the next checkpoint.",
          );
          return;
        }
        scene?.focus(id);
        heldFeedback = null;
        action(attemptPath() + "/inspect", { objectId: id });
      }
      const click = (event) => {
        const b = event.target.closest("button");
        if (!b || !wrap.contains(b)) return;
        if (
          b.hasAttribute("data-start-training") ||
          b.hasAttribute("data-retry-training")
        ) {
          heldFeedback = null;
          action(`/training/${moduleKey}/start`, { acknowledged: true });
          scene?.focus(c.objects[0].id);
        } else if (b.hasAttribute("data-inspect-object"))
          inspect(b.dataset.inspectObject);
        else if (b.hasAttribute("data-focus-object")) {
          scene?.focus(b.dataset.focusObject);
          if (sceneUnavailable)
            notify("Use Inspect to complete this checkpoint without 3D.");
        } else if (b.hasAttribute("data-activity-option"))
          action(
            attemptPath() + "/activity-answer",
            { taskId: attempt.task.id, optionId: b.dataset.activityOption },
            { feedback: true },
          );
        else if (b.hasAttribute("data-quiz-option"))
          action(
            attemptPath() + "/quiz/answer",
            {
              questionId: attempt.currentQuestion.id,
              optionId: b.dataset.quizOption,
            },
            { feedback: true },
          );
        else if (b.hasAttribute("data-quiz-skip"))
          action(
            attemptPath() + "/quiz/answer",
            { questionId: attempt.currentQuestion.id, optionId: null },
            { feedback: true },
          );
        else if (b.hasAttribute("data-quiz-next")) nextQuestion();
        else if (b.hasAttribute("data-feedback-next")) advanceFeedback();
        else if (b.hasAttribute("data-pause-auto")) {
          clearTimeout(autoAdvance);
          b.parentElement.textContent =
            "Automatic continuation paused. Use Next question when you are ready.";
        } else if (b.hasAttribute("data-history-id")) {
          heldFeedback = null;
          action(`/training/attempts/${b.dataset.historyId}`, null, {
            get: true,
          });
        } else if (b.hasAttribute("data-reconnect")) {
          heldFeedback = null;
          if (attempt) action(attemptPath(), null, { get: true });
          else {
            errorBox.hidden = true;
            status("Ready to start");
          }
        } else if (b.hasAttribute("data-look")) {
          const mode = b.dataset.look;
          if (mode === "reset")
            scene?.focus(attempt?.nextTask?.objectId || c.objects[0].id);
          else if (mode === "left" || mode === "right")
            scene?.rotate(mode === "left" ? 0.4 : -0.4);
          else scene?.zoom(mode === "in" ? -7 : 7);
        }
      };
      wrap.addEventListener("click", click);
      const changed = (e) => {
        if (e.target.id === "training-ack")
          wrap.querySelector("[data-start-training]").disabled =
            !e.target.checked || busy;
      };
      wrap.addEventListener("change", changed);
      const onVisibility = () => {
        scene?.setVisible(
          !document.hidden &&
            !wrap.querySelector("[data-activity-layout]").hidden,
        );
        if (!document.hidden && attempt?.phase === "quiz" && !busy)
          action(attemptPath(), null, { get: true });
      };
      document.addEventListener("visibilitychange", onVisibility);
      render();
      view
        .loadScene()
        .then((createScene) => {
          if (!alive) return;
          warehouse.querySelector(".scene-loading")?.remove();
          try {
            scene = createScene(warehouse, c.objects, inspect);
            scene.update(
              attempt?.activityAnswers || [],
              attempt?.nextTask?.objectId || c.objects[0].id,
            );
            scene.focus(attempt?.nextTask?.objectId || c.objects[0].id);
            scene.setVisible(
              !wrap.querySelector("[data-activity-layout]").hidden,
            );
          } catch (e) {
            fallback();
          }
        })
        .catch(fallback);
      function fallback() {
        if (!alive) return;
        sceneUnavailable = true;
        warehouse.dataset.sceneReady = "fallback";
        warehouse.innerHTML = `<div class="scene-fallback">${icon(view.icon, 40)}<h3>Use the accessible scene checkpoints</h3><p>3D rendering is unavailable in this browser. The same five activity decisions, marking and quiz remain available using the Inspect buttons.</p><small>For 3D, try Chrome or Edge with hardware acceleration enabled.</small></div>`;
        wrap
          .querySelectorAll("[data-look]")
          .forEach((b) => (b.disabled = true));
      }
      const initial = requestedAttempt || data.activeAttemptId;
      if (initial)
        action(`/training/attempts/${encodeURIComponent(initial)}`, null, {
          get: true,
        });
      return () => {
        alive = false;
        clearTimers();
        scene?.dispose();
        wrap.removeEventListener("click", click);
        wrap.removeEventListener("change", changed);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    },
  };
}

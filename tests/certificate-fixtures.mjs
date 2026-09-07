// Test-only helpers: complete the real HTTP assessment flow, never inject totals.
import { COURSES } from "../server/training-content.js";
export async function finishModule(
  get,
  post,
  key,
  {
    activityCorrect = 5,
    quizCorrect = 5,
    identified = 5,
    incorrectFlags = 0,
  } = {},
) {
  const c = COURSES[key];
  let r = await post(`/training/${key}/start`, { acknowledged: true });
  const id = r.attempt.id,
    base = `/training/attempts/${id}`;
  if (c.type === "hunt") {
    let comparison = 0;
    for (const o of c.objects) {
      await post(base + "/inspect", { objectId: o.id });
      const taskIndex = c.tasks.findIndex((t) => t.objectId === o.id);
      const flagged =
        taskIndex >= 0 ? taskIndex < identified : comparison++ < incorrectFlags;
      await post(base + "/classify", { objectId: o.id, flagged });
      if (taskIndex >= 0) {
        const t = c.tasks[taskIndex];
        await post(base + "/activity-answer", {
          taskId: t.id,
          optionId:
            taskIndex < activityCorrect
              ? t.correctId
              : t.options.find((o) => o.id !== t.correctId).id,
        });
      }
    }
  } else
    for (const [i, t] of c.tasks.entries()) {
      await post(base + "/inspect", { objectId: t.objectId });
      await post(base + "/activity-answer", {
        taskId: t.id,
        optionId:
          i < activityCorrect
            ? t.correctId
            : t.options.find((o) => o.id !== t.correctId).id,
      });
    }
  r = await get(base);
  for (let n = 0; n < 5; n++) {
    r = await post(base + "/quiz/next", {
      afterQuestionId: r.attempt.lastQuizQuestionId,
    });
    const q = c.questions.find((q) => q.id === r.attempt.currentQuestion.id);
    r = await post(base + "/quiz/answer", {
      questionId: q.id,
      optionId: n < quizCorrect ? q.correctId : null,
    });
  }
  return r;
}
export const issueBody = (status) => ({
  recipientId: status.employeeId,
  reviewKey: status.reviewKey,
});

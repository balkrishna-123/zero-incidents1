import { learningModulePage } from "./learning-module.js";
export const workingAtHeightPage = (ctx, requestedAttempt = null) =>
  learningModulePage(ctx, "working-at-height", requestedAttempt);

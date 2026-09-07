import { learningModulePage } from "./learning-module.js";
export const manualHandlingPage = (ctx, requestedAttempt = null) =>
  learningModulePage(ctx, "manual-handling", requestedAttempt);

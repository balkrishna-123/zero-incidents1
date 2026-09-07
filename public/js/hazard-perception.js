import { learningModulePage } from "./learning-module.js";
export const hazardPerceptionPage = (ctx, requestedAttempt = null) =>
  learningModulePage(ctx, "hazard-perception", requestedAttempt);

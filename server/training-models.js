import mongoose from "mongoose";
import { MODULE_KEYS } from "./config.js";
const { Schema, model } = mongoose;
const activityAnswer = new Schema(
  {
    taskId: String,
    optionId: String,
    correct: Boolean,
    identificationCorrect: Boolean,
    answeredAt: Date,
  },
  { _id: false },
);
const quizAnswer = new Schema(
  {
    questionId: String,
    optionId: { type: String, default: null },
    correct: Boolean,
    timedOut: Boolean,
    answeredAt: Date,
  },
  { _id: false },
);
const areaClassification = new Schema(
  { objectId: String, flagged: Boolean, correct: Boolean, classifiedAt: Date },
  { _id: false },
);
const attemptSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    moduleKey: { type: String, enum: MODULE_KEYS, required: true },
    version: { type: String, required: true },
    phase: {
      type: String,
      enum: ["activity", "quiz-ready", "quiz", "feedback", "completed"],
      default: "activity",
    },
    open: { type: Boolean, default: true },
    activityAnswers: { type: [activityAnswer], default: [] },
    inspected: { type: [String], default: [] },
    classifications: { type: [areaClassification], default: [] },
    selectedObjectId: { type: String, default: null },
    safeFindings: { type: [String], default: [] },
    selectedTaskId: { type: String, default: null },
    quizOrder: { type: [String], required: true },
    optionOrders: { type: Map, of: [String] },
    quizAnswers: { type: [quizAnswer], default: [] },
    questionStartedAt: Date,
    questionDeadline: Date,
    activityScore: { type: Number, min: 0, max: 70 },
    quizScore: { type: Number, min: 0, max: 30 },
    score: { type: Number, min: 0, max: 100 },
    completedAt: Date,
    recordedAt: Date,
  },
  { timestamps: true, optimisticConcurrency: true },
);
attemptSchema.index(
  { employeeId: 1, moduleKey: 1, open: 1 },
  { unique: true, partialFilterExpression: { open: true } },
);
export const TrainingAttempt = model("TrainingAttempt", attemptSchema);

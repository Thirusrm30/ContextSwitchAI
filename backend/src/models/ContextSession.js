const mongoose = require("mongoose");

const tabContextSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: "" },
  favicon: { type: String, default: "" },
  domain: { type: String, default: "" },
  category: { type: String, default: "general" },
  timeSpentSeconds: { type: Number, default: 0 },
  capturedAt: { type: Date, default: Date.now },
});

const contextSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    deviceId: {
      type: String,
      trim: true,
      default: "dev_default",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    projectName: {
      type: String,
      trim: true,
      default: "General Browsing",
    },
    task: {
      type: String,
      trim: true,
      default: "Active Workflow",
    },
    contextScore: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    tabs: [tabContextSchema],
    summary: {
      type: String,
      default: "",
    },
    suggestedNextStep: {
      type: String,
      default: "",
    },
    unfinishedWork: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    switchCount: {
      type: Number,
      default: 0,
    },
    timeline: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

contextSessionSchema.index({ deviceId: 1, createdAt: -1 });
contextSessionSchema.index({ userId: 1, createdAt: -1 });
contextSessionSchema.index({ projectId: 1 });

module.exports = mongoose.model("ContextSession", contextSessionSchema);

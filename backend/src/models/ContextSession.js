const mongoose = require("mongoose");

const tabContextSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: "" },
  favicon: { type: String, default: "" },
  capturedAt: { type: Date, default: Date.now },
});

const contextSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    projectName: {
      type: String,
      trim: true,
      default: "",
    },
    task: {
      type: String,
      trim: true,
      default: "",
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
    nextAction: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

contextSessionSchema.index({ userId: 1, createdAt: -1 });
contextSessionSchema.index({ projectId: 1 });

module.exports = mongoose.model("ContextSession", contextSessionSchema);

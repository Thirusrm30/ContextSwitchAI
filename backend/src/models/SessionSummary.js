const mongoose = require("mongoose");

const sessionSummarySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContextSession",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    filesAccessed: {
      type: [String],
      default: [],
    },
    nextSteps: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sessionSummarySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SessionSummary", sessionSummarySchema);

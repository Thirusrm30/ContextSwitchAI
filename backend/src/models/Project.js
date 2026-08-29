const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    repoUrl: {
      type: String,
      default: "",
    },
    sessionCount: {
      type: Number,
      default: 1,
    },
    totalTabsOpened: {
      type: Number,
      default: 0,
    },
    averageContextScore: {
      type: Number,
      default: 80,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ deviceId: 1, name: 1 });
projectSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model("Project", projectSchema);

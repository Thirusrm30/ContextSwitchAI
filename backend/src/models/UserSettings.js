const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    captureEnabled: {
      type: Boolean,
      default: true,
    },
    autoSummarize: {
      type: Boolean,
      default: false,
    },
    maxTabsStored: {
      type: Number,
      default: 50,
      min: 1,
      max: 200,
    },
    defaultProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSettings", userSettingsSchema);

const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
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
    excludedDomains: {
      type: [String],
      default: [],
    },
    privacyMode: {
      type: String,
      default: "local_only",
    },
  },
  { timestamps: true }
);

userSettingsSchema.index({ deviceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("UserSettings", userSettingsSchema);

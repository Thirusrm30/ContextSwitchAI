const UserSettings = require("../models/UserSettings");

const getSettings = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  let settings = await UserSettings.findOne({ userId });

  if (!settings) {
    settings = await UserSettings.create({ userId });
  }

  res.json(settings);
};

const updateSettings = async (req, res) => {
  const { userId, ...updates } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required in body" });
  }

  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, runValidators: true, upsert: true }
  );

  res.json(settings);
};

module.exports = {
  getSettings,
  updateSettings,
};

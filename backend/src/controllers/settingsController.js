const UserSettings = require("../models/UserSettings");

const getSettings = async (req, res) => {
  const { userId, deviceId = "dev_default" } = req.query;

  const query = userId ? { userId } : { deviceId };
  let settings = await UserSettings.findOne(query);

  if (!settings) {
    settings = await UserSettings.create(query);
  }

  res.json(settings);
};

const updateSettings = async (req, res) => {
  const { userId, deviceId = "dev_default", ...updates } = req.body;

  const query = userId ? { userId } : { deviceId };

  const settings = await UserSettings.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true, runValidators: true, upsert: true }
  );

  res.json(settings);
};

module.exports = {
  getSettings,
  updateSettings,
};

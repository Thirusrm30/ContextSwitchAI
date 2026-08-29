const ContextSession = require("../models/ContextSession");

const createSession = async (req, res) => {
  const session = await ContextSession.create({
    userId: req.body.userId || null,
    deviceId: req.body.deviceId || "dev_default",
    projectId: req.body.projectId || null,
    projectName: req.body.projectName || "General Browsing",
    task: req.body.task || "Active Workflow",
    contextScore: req.body.contextScore || 0,
    durationMinutes: req.body.durationMinutes || 0,
    startedAt: req.body.startedAt || new Date(),
    endedAt: req.body.endedAt || null,
    tabs: req.body.tabs || [],
    summary: req.body.summary || "",
    suggestedNextStep: req.body.suggestedNextStep || "",
    unfinishedWork: req.body.unfinishedWork || "",
    tags: req.body.tags || [],
    switchCount: req.body.switchCount || 0,
    timeline: req.body.timeline || [],
  });

  res.status(201).json(session);
};

const getSessions = async (req, res) => {
  const { userId, deviceId, projectId, limit = 20, skip = 0 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  else if (deviceId) filter.deviceId = deviceId;
  if (projectId) filter.projectId = projectId;

  const sessions = await ContextSession.find(filter)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

  const total = await ContextSession.countDocuments(filter);

  res.json({ sessions, total, skip: Number(skip), limit: Number(limit) });
};

const getSessionById = async (req, res) => {
  const session = await ContextSession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(session);
};

const endSession = async (req, res) => {
  const session = await ContextSession.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        endedAt: new Date(),
        ...(req.body.summary && { summary: req.body.summary }),
        ...(req.body.durationMinutes && { durationMinutes: req.body.durationMinutes }),
        ...(req.body.suggestedNextStep && { suggestedNextStep: req.body.suggestedNextStep }),
      }
    },
    { new: true }
  );

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(session);
};

const deleteSession = async (req, res) => {
  const session = await ContextSession.findByIdAndDelete(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ message: "Session deleted" });
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  endSession,
  deleteSession,
};

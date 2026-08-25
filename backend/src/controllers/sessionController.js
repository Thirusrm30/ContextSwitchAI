const ContextSession = require("../models/ContextSession");

const createSession = async (req, res) => {
  const session = await ContextSession.create({
    userId: req.body.userId,
    projectId: req.body.projectId || null,
    projectName: req.body.projectName || "",
    task: req.body.task || "",
    startedAt: req.body.startedAt || new Date(),
    tabs: req.body.tabs || [],
    summary: req.body.summary || "",
    nextAction: req.body.nextAction || "",
  });

  res.status(201).json(session);
};

const getSessions = async (req, res) => {
  const { userId, projectId, limit = 20, skip = 0 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
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
  deleteSession,
};

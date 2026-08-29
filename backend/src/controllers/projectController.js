const Project = require("../models/Project");

const createProject = async (req, res) => {
  const project = await Project.create({
    userId: req.body.userId || null,
    deviceId: req.body.deviceId || "dev_default",
    name: req.body.name,
    description: req.body.description || "",
    repoUrl: req.body.repoUrl || "",
    sessionCount: req.body.sessionCount || 1,
    totalTabsOpened: req.body.totalTabsOpened || 0,
    averageContextScore: req.body.averageContextScore || 80,
    tags: req.body.tags || [],
  });

  res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const { userId, deviceId } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  else if (deviceId) filter.deviceId = deviceId;

  const projects = await Project.find(filter).sort({ createdAt: -1 });

  res.json(projects);
};

module.exports = {
  createProject,
  getProjects,
};

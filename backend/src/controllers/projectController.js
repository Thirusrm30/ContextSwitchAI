const Project = require("../models/Project");

const createProject = async (req, res) => {
  const project = await Project.create({
    userId: req.body.userId,
    name: req.body.name,
    description: req.body.description || "",
    repoUrl: req.body.repoUrl || "",
  });

  res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const { userId } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;

  const projects = await Project.find(filter).sort({ createdAt: -1 });

  res.json(projects);
};

module.exports = {
  createProject,
  getProjects,
};

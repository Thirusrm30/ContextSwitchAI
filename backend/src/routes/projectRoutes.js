const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const asyncHandler = require("../middleware/asyncHandler");
const {
  createProject,
  getProjects,
} = require("../controllers/projectController");

const router = express.Router();

router.post(
  "/",
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("name").notEmpty().withMessage("Project name is required"),
  ],
  validate,
  asyncHandler(createProject)
);

router.get("/", asyncHandler(getProjects));

module.exports = router;

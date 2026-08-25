const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const asyncHandler = require("../middleware/asyncHandler");
const {
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
} = require("../controllers/sessionController");

const router = express.Router();

router.post(
  "/",
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("tabs").optional().isArray(),
  ],
  validate,
  asyncHandler(createSession)
);

router.get("/", asyncHandler(getSessions));

router.get("/:id", asyncHandler(getSessionById));

router.delete("/:id", asyncHandler(deleteSession));

module.exports = router;

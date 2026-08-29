const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const {
  createSession,
  getSessions,
  getSessionById,
  endSession,
  deleteSession,
} = require("../controllers/sessionController");

const router = express.Router();

router.post("/", asyncHandler(createSession));
router.get("/", asyncHandler(getSessions));
router.get("/:id", asyncHandler(getSessionById));
router.put("/:id/end", asyncHandler(endSession));
router.delete("/:id", asyncHandler(deleteSession));

module.exports = router;

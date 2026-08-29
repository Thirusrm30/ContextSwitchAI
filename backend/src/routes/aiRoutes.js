const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { analyze, summarize } = require("../controllers/aiController");

const router = express.Router();

router.post("/analyze", asyncHandler(analyze));
router.post("/summarize", asyncHandler(summarize));

module.exports = router;

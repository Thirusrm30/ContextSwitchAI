const geminiService = require("../services/geminiService");

const analyze = async (req, res) => {
  try {
    const result = await geminiService.analyzeContext(req.body);
    res.json(result);
  } catch (err) {
    console.warn("[AI Controller] Analysis failed:", err.message);
    res.status(503).json({ error: err.message, fallback: true });
  }
};

const summarize = async (req, res) => {
  try {
    const summary = await geminiService.generateSummary(req.body);
    res.json({ summary });
  } catch (err) {
    console.warn("[AI Controller] Summary failed:", err.message);
    res.status(503).json({ error: err.message, fallback: true });
  }
};

module.exports = {
  analyze,
  summarize
};

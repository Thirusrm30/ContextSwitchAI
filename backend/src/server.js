const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./services/db");
const errorHandler = require("./middleware/errorHandler");
const sessionRoutes = require("./routes/sessionRoutes");
const projectRoutes = require("./routes/projectRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/sessions", sessionRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/settings", settingsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ContextSwitch backend running on port ${PORT}`);
});

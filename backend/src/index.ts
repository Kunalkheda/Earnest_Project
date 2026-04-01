import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "Task Management API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;

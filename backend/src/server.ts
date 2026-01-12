import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import skillsRoutes from "./routes/skills";
import "./schema";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});

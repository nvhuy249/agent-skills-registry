import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});

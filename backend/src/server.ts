import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import skillsRoutes from "./routes/skills";
import "./schema";
import { attachUser } from "./middleware/auth";

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(attachUser);
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

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
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(attachUser);
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});

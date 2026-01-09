import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../db";

const router = Router();

type DbUser = {
  id: number;
  username: string;
  password_hash: string;
};

// User signup
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (existingUser) {
    return res.status(409).json({ error: "Username already exists" });
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);
  const userId = Number(result.lastInsertRowid);

  return res.status(201).json({ message: "User created successfully", userId });
})

// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as DbUser | undefined;
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  return res.status(200).json({ message: "Login successful", userId: user.id });
});

export default router;

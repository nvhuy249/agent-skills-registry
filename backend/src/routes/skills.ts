import { Router } from "express";
import db from "../db";
import matter from "gray-matter";

const router = Router();

// Load skills for a user
router.get("/loadskills", (req, res) => {
  const userId =
    (req.headers["x-user-id"] as string | undefined) ??
    (req.query.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const skills = db.prepare("SELECT id, name, description, updated_at AS updatedAt, is_public FROM skills WHERE user_id = ?")
    .all(userId);
  return res.status(200).json({ skills });
});

// Upload a new skill
router.post("/uploadskill", (req, res) => {
  const userId =
    (req.headers["x-user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { markdown } = req.body as { markdown: string };
  if (!markdown) {
    return res.status(400).json({ error: "Missing skill markdown" });
  }

  const { data, content } = matter(markdown);
  const name = typeof data.name === "string" ? data.name : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;

  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  db.prepare("INSERT INTO skills (user_id, name, description, content) VALUES (?, ?, ?, ?)")
    .run(userId, name, description, content);

  return res.status(201).json({ message: "Skill uploaded successfully" });
});

export default router;

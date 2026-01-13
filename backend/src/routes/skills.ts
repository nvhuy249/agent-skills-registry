import { Router } from "express";
import db from "../db";
import matter from "gray-matter";

const router = Router();

type SkillRow = {
  id: number;
  name: string;
  description?: string | null;
  updatedAt: string;
  is_public?: number | boolean | null;
  allowed_tools?: string | null;
  cloned_from_user_id?: number | null;
  cloned_from_username?: string | null;
};

type markdownFile = {
  name: string;
  description?: string | null;
  allowed_tools?: string | null;
  content: string;
  updatedAt: string;
  is_public?: number | boolean | null;
  cloned_from_user_id?: number | null;
  cloned_from_username?: string | null;
};

function parseAllowedTools(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string");
      }
    } catch {
      const items = raw
        .split(/[,\\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (items.length > 0) return items;
    }
  }
  return [];
}

// Load skills for a user
router.get("/loadskills", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.query.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = db.prepare(`
    SELECT
      id,
      name,
      description,
      updated_at AS updatedAt,
      is_public,
      allowed_tools,
      cloned_from_user_id,
      (
        SELECT username FROM users WHERE id = cloned_from_user_id
      ) AS cloned_from_username
    FROM skills
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(userId) as SkillRow[];

  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    updatedAt: row.updatedAt,
    is_public: row.is_public,
    allowedTools: parseAllowedTools(row.allowed_tools),
    cloned_from_user_id: row.cloned_from_user_id,
    cloned_from_username: row.cloned_from_username,
  }));

  return res.status(200).json({ skills });
});

// Load public skills
router.get("/publicskills", (_req, res) => {
  const rows = db.prepare(`
    SELECT
      skills.id,
      skills.name,
      skills.description,
      skills.updated_at AS updatedAt,
      skills.allowed_tools,
      users.username AS owner,
      cloned_from_user_id,
      (
        SELECT username FROM users WHERE id = cloned_from_user_id
      ) AS cloned_from_username
    FROM skills
    JOIN users ON skills.user_id = users.id
    WHERE skills.is_public = 1
    ORDER BY skills.updated_at DESC
  `).all() as (SkillRow & { owner: string })[];
  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    updatedAt: row.updatedAt,
    allowedTools: parseAllowedTools(row.allowed_tools),
    owner: row.owner,
    cloned_from_user_id: row.cloned_from_user_id,
    cloned_from_username: row.cloned_from_username,
  }));
  return res.status(200).json({ skills });
});

// Upload a new skill
router.post("/uploadskill", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { markdown } = req.body as { markdown: string };
  if (!markdown) {
    return res.status(400).json({ error: "Missing skill markdown" });
  }

  const { data, content } = matter(markdown);
  const name = typeof data.name === "string" ? data.name : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;
  const allowedTools = parseAllowedTools((data as Record<string, unknown>)["allowed-tools"]);

  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  db.prepare("INSERT INTO skills (user_id, name, description, content, allowed_tools) VALUES (?, ?, ?, ?, ?)")
    .run(userId, name, description, content, JSON.stringify(allowedTools));

  return res.status(201).json({ message: "Skill uploaded successfully" });
});

// Delete a skill
router.delete("/deleteskill", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { skillId } = req.body as { skillId: number };
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }

  const skill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  db.prepare("DELETE FROM skills WHERE id = ? AND user_id = ?").run(skillId, userId);
  return res.status(200).json({ message: "Skill deleted successfully" });
});

// Load a single skill for editing
router.get("/showskill", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.query.userId as string | undefined);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const skillId = Number(req.query.skillId as string | undefined);
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }

  const skill = db
    .prepare(
      `
        SELECT 
          skills.name,
          skills.description,
          skills.allowed_tools,
          skills.content,
          skills.updated_at as updatedAt,
          skills.is_public,
          skills.cloned_from_user_id,
          source.username as cloned_from_username
        FROM skills
        LEFT JOIN users as source ON source.id = skills.cloned_from_user_id
        WHERE skills.id = ? AND skills.user_id = ?
      `
    )
    .get(skillId, userId) as markdownFile | undefined;
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  const file = {
    data: {
      name: skill.name,
      description: skill.description,
      "allowed_tools": parseAllowedTools(skill.allowed_tools),
    },
    content: skill.content,
  }

  const markdown = matter.stringify(file.content, {
    name: file.data.name,
    description: file.data.description,
    "allowed_tools": parseAllowedTools(file.data["allowed_tools"]),
  });

  return res.status(200).json({
    name: skill.name,
    description: skill.description,
    allowedTools: parseAllowedTools(skill.allowed_tools),
    updatedAt: skill.updatedAt,
    is_public: skill.is_public, 
    cloned_from_user_id: skill.cloned_from_user_id,
    cloned_from_username: skill.cloned_from_username,
    markdown });
});

// Show a public skill
router.get("/showpublicskill", (req, res) => {
  const skillId = Number(req.query.skillId as string | undefined);
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const skill = db
    .prepare(`SELECT 
                skills.name,
                skills.description,
                skills.allowed_tools,
                skills.content,
                skills.updated_at as updatedAt,
                skills.is_public,
                users.username AS owner,
                skills.cloned_from_user_id,
                source.username AS cloned_from_username
              FROM skills
              JOIN users ON skills.user_id = users.id
              LEFT JOIN users AS source ON source.id = skills.cloned_from_user_id
              WHERE skills.id = ? AND skills.is_public = 1`).get(skillId) as (markdownFile & { owner: string }) | undefined;
  if (!skill) {
    return res.status(404).json({ error: "Skill not found or not public" });
  }
  const file = {
    data: {
      name: skill.name,
      description: skill.description,
      "allowed_tools": parseAllowedTools(skill.allowed_tools),
    },
    content: skill.content,
  };
  const markdown = matter.stringify(file.content, {
    name: file.data.name,
    description: file.data.description,
    "allowed_tools": parseAllowedTools(file.data["allowed_tools"]),
  });
  return res.status(200).json({
    name: skill.name,
    description: skill.description,
    allowedTools: parseAllowedTools(skill.allowed_tools),
    updatedAt: skill.updatedAt,
    is_public: skill.is_public,
    owner: skill.owner,
    cloned_from_user_id: skill.cloned_from_user_id,
    cloned_from_username: skill.cloned_from_username,
    markdown,
  });
});

// Update an existing skill
router.post("/editskill", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { skillId, markdown } = req.body as { skillId: number; markdown: string };
  if (!skillId || !markdown) {
    return res.status(400).json({ error: "Missing skillId or markdown" });
  }
  const existingSkill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!existingSkill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  const { data, content } = matter(markdown);
  const name = typeof data.name === "string" ? data.name : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;
  const allowedTools = parseAllowedTools((data as Record<string, unknown>)["allowed-tools"]);
  const updatedAt = new Date().toISOString();
  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  db.prepare("UPDATE skills SET name = ?, description = ?, content = ?, allowed_tools = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .run(name, description, content, JSON.stringify(allowedTools), updatedAt, skillId, userId);
  return res.status(200).json({ message: "Skill updated successfully", updatedAt});
});

// Change skill privacy
router.post("/changeprivacy", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { skillId, is_public } = req.body as { skillId: number; is_public: boolean | string | number };
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const existingSkill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!existingSkill) {
    return res.status(404).json({ error: "Skill not found" });
  }
  const newPrivacy = is_public;
  db.prepare("UPDATE skills SET is_public = ? WHERE id = ? AND user_id = ?")
    .run(newPrivacy ? 1 : 0, skillId, userId);
  return res.status(200).json({ message: "Skill privacy updated successfully" });
});

// Download a skill
router.get("/downloadskill", (req, res) => {
  const { skillId } = req.query as { skillId: string };
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const skill = db.prepare("SELECT name, description, allowed_tools, content FROM skills WHERE id = ? AND is_public = 1").get(skillId) as markdownFile | undefined;
  if (!skill) {
    return res.status(404).json({ error: "Skill not found or not public" });
  }
  const file = {
    data: {
      name: skill.name,
      description: skill.description,
      "allowed_tools": parseAllowedTools(skill.allowed_tools),
    },
    content: skill.content,
  };

  const markdown = matter.stringify(file.content, {
    name: file.data.name,
    description: file.data.description,
    "allowed_tools": parseAllowedTools(file.data["allowed_tools"]),
  });
  res.setHeader("Content-Disposition", `attachment; filename="${skill.name}.md"`);
  res.setHeader("Content-Type", "text/markdown");
  return res.status(200).send(markdown);
});

// Clone a public skill
router.post("/clonepublicskill", (req, res) => {
  const userId =
    (req.headers["user-id"] as string | undefined) ??
    (req.body.userId as string | undefined);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { skillId } = req.body as { skillId: number };
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const skill = db.prepare("SELECT * FROM skills WHERE id = ? AND is_public = 1").get(skillId) as markdownFile & { user_id: number } | undefined;
  if (!skill) {
    return res.status(404).json({ error: "Skill not found or not public" });
  }
  db.prepare("INSERT INTO skills (user_id, name, description, content, allowed_tools, cloned_from_user_id) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, skill.name, skill.description, skill.content, JSON.stringify(parseAllowedTools(skill.allowed_tools)), skill.user_id);
  return res.status(201).json({ message: "Skill cloned successfully" });
});

export default router;

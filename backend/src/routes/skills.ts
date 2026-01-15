import { Router } from "express";
import db from "../db";
import matter from "gray-matter";
import { requireAuth } from "../middleware/auth";

const router = Router();

type SkillRow = {
  id: number;
  name: string;
  description?: string | null;
  updatedAt: string;
  latestVersion?: number | null;
  is_public?: number | boolean | null;
  allowed_tools?: string | null;
  cloned_from_user_id?: number | null;
  cloned_from_username?: string | null;
  tag_list?: string[] | null;
  download_count?: number;
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
  download_count: number;
};

type tagRow = {
  id: number;
  name: string;
};

type SkillVersionRow = {
  version: number;
  created_at: string;
  name: string;
  description?: string | null;
  content: string;
  allowed_tools?: string | null;
  message?: string | null;
};

function canAccessSkill(skillId: number, userId?: number | null) {
  const skill = db
    .prepare("SELECT id, user_id, is_public FROM skills WHERE id = ?")
    .get(skillId) as { id: number; user_id: number; is_public: number | boolean } | undefined;
  if (!skill) return { status: 404 as const, error: "Skill not found" };
  const isOwner = userId && Number(userId) === Number(skill.user_id);
  const isPublic = Boolean(skill.is_public);
  if (!isOwner && !isPublic) {
    return { status: 403 as const, error: "Forbidden" };
  }
  return { status: 200 as const, skill, isOwner, isPublic };
}

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

function extractAllowedTools(data: Record<string, unknown>): string[] {
  const withDash = (data as Record<string, unknown>)["allowed-tools"];
  const withUnderscore = (data as Record<string, unknown>)["allowed_tools"];
  return parseAllowedTools(withDash ?? withUnderscore);
}

// Load skills for a user
router.get("/loadskills", requireAuth, (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = db.prepare(`
    SELECT
      skills.id,
      skills.name,
      skills.description,
      skills.updated_at AS updatedAt,
      (
        SELECT MAX(version) FROM skill_versions WHERE skill_id = skills.id
      ) AS latestVersion,
      skills.is_public,
      skills.allowed_tools,
      skills.cloned_from_user_id,
      (
        SELECT username FROM users WHERE id = skills.cloned_from_user_id
      ) AS cloned_from_username,
      GROUP_CONCAT(tags.name) AS tag_list,
      skills.download_count
    FROM skills
    LEFT JOIN skill_tags ON skills.id = skill_tags.skill_id
    LEFT JOIN tags ON skill_tags.tag_id = tags.id
    WHERE user_id = ?
    GROUP BY skills.id
    ORDER BY skills.updated_at DESC
  `).all(userId) as SkillRow[];

  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    updatedAt: row.updatedAt,
    latestVersion: row.latestVersion,
    is_public: row.is_public,
    allowedTools: parseAllowedTools(row.allowed_tools),
    cloned_from_user_id: row.cloned_from_user_id,
    cloned_from_username: row.cloned_from_username,
    tag_list: row.tag_list
      ? String(row.tag_list)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    download_count: row.download_count,
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
      (
        SELECT MAX(version) FROM skill_versions WHERE skill_id = skills.id
      ) AS latestVersion,
      skills.allowed_tools,
      users.username AS owner,
      cloned_from_user_id,
      (
        SELECT username FROM users WHERE id = cloned_from_user_id
      ) AS cloned_from_username,
      GROUP_CONCAT(tags.name) AS tag_list,
      skills.download_count
    FROM skills
    JOIN users ON skills.user_id = users.id
    LEFT JOIN skill_tags ON skills.id = skill_tags.skill_id
    LEFT JOIN tags ON skill_tags.tag_id = tags.id
    WHERE skills.is_public = 1
    GROUP BY skills.id
    ORDER BY skills.updated_at DESC
  `).all() as (SkillRow & { owner: string })[];
  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    updatedAt: row.updatedAt,
    latestVersion: row.latestVersion,
    allowedTools: parseAllowedTools(row.allowed_tools),
    owner: row.owner,
    cloned_from_user_id: row.cloned_from_user_id,
    cloned_from_username: row.cloned_from_username,
    tag_list: row.tag_list
      ? String(row.tag_list)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    download_count: row.download_count,
  }));
  return res.status(200).json({ skills });
});

// Upload a new skill
router.post("/uploadskill", requireAuth, (req, res) => {
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { markdown } = req.body as { markdown: string };
  if (!markdown) {
    return res.status(400).json({ error: "Missing skill markdown" });
  }

  const { data, content } = matter(markdown);
  const name = typeof data.name === "string" ? data.name : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;
  const allowedTools = extractAllowedTools(data as Record<string, unknown>);

  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  const insertSkill = db.prepare("INSERT INTO skills (user_id, name, description, content, allowed_tools) VALUES (?, ?, ?, ?, ?)");
  const insertVersion = db.prepare(`
    INSERT INTO skill_versions (skill_id, version, name, description, content, allowed_tools, created_at, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const insert = insertSkill.run(userId, name, description, content, JSON.stringify(allowedTools));
  const skillId = Number(insert.lastInsertRowid);
  insertVersion.run(skillId, 1, name, description, content, JSON.stringify(allowedTools), now, null);

  return res.status(201).json({ message: "Skill uploaded successfully", skillId, version: 1, updatedAt: now });
});

// Delete a skill
router.delete("/deleteskill", requireAuth, (req, res) => {
  const userId = req.user?.userId;

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
  db.prepare("DELETE FROM skill_tags WHERE skill_id = ?").run(skillId);
  return res.status(200).json({ message: "Skill deleted successfully" });
});

// Load a single skill for editing
router.get("/showskill", requireAuth, (req, res) => {
  const userId = req.user?.userId;

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
          source.username as cloned_from_username,
          skills.download_count
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
    downloadCount: skill.download_count,
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
                source.username AS cloned_from_username,
                skills.download_count
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
    downloadCount: skill.download_count,
    markdown,
  });
});

// Update an existing skill
router.post("/editskill", requireAuth, (req, res) => {
  const userId = req.user?.userId;
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
  const allowedTools = extractAllowedTools(data as Record<string, unknown>);
  const updatedAt = new Date().toISOString();
  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  db.prepare("UPDATE skills SET name = ?, description = ?, content = ?, allowed_tools = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .run(name, description, content, JSON.stringify(allowedTools), updatedAt, skillId, userId);
  return res.status(200).json({ message: "Skill updated successfully", updatedAt });
});

// Change skill privacy
router.post("/changeprivacy", requireAuth, (req, res) => {
  const userId = req.user?.userId;
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
  const skill = db.prepare("SELECT name, description, allowed_tools, content, download_count FROM skills WHERE id = ? AND is_public = 1").get(skillId) as markdownFile | undefined;
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

  const download_count = skill.download_count + 1;
  db.prepare("UPDATE skills SET download_count = ? WHERE id = ?").run(download_count, skillId);

  const markdown = matter.stringify(file.content, {
    name: file.data.name,
    description: file.data.description,
    "allowed_tools": parseAllowedTools(file.data["allowed_tools"]),
  });
  res.setHeader("Content-Disposition", `attachment; filename="${skill.name}.md"`);
  res.setHeader("Content-Type", "text/markdown");
  return res.status(200).send(markdown);
});

// List skill versions
router.get("/loadversions", (req, res) => {
  const userId = req.user?.userId ?? null;
  const skillId = Number(req.query.skillId as string | undefined);
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const access = canAccessSkill(skillId, userId);
  if (access.status !== 200) {
    return res.status(access.status).json({ error: access.error });
  }
  const versions = db
    .prepare(
      `
        SELECT version, created_at, name, description, message
        FROM skill_versions
        WHERE skill_id = ?
        ORDER BY version DESC
      `
    )
    .all(skillId) as SkillVersionRow[];
  return res.status(200).json({
    versions: versions.map((v) => ({
      version: v.version,
      createdAt: v.created_at,
      name: v.name,
      description: v.description,
      message: v.message,
    })),
  });
});

// Get a specific version snapshot
router.get("/showversion", (req, res) => {
  const userId = req.user?.userId ?? null;
  const skillId = Number(req.query.skillId as string | undefined);
  const version = Number(req.query.version as string | undefined);
  if (!skillId || !version) {
    return res.status(400).json({ error: "Missing skillId or version" });
  }
  const access = canAccessSkill(skillId, userId);
  if (access.status !== 200) {
    return res.status(access.status).json({ error: access.error });
  }
  const snapshot = db
    .prepare(
      `
        SELECT version, created_at, name, description, content, allowed_tools, message
        FROM skill_versions
        WHERE skill_id = ? AND version = ?
      `
    )
    .get(skillId, version) as SkillVersionRow | undefined;
  if (!snapshot) {
    return res.status(404).json({ error: "Version not found" });
  }
  const file = {
    data: {
      name: snapshot.name,
      description: snapshot.description,
      "allowed_tools": parseAllowedTools(snapshot.allowed_tools),
    },
    content: snapshot.content,
  };
  const markdown = matter.stringify(file.content, {
    name: file.data.name,
    description: file.data.description,
    "allowed_tools": parseAllowedTools(file.data["allowed_tools"]),
  });
  return res.status(200).json({
    version: snapshot.version,
    createdAt: snapshot.created_at,
    name: snapshot.name,
    description: snapshot.description,
    content: snapshot.content,
    markdown,
    allowedTools: parseAllowedTools(snapshot.allowed_tools),
    message: snapshot.message,
  });
});

// Push a new version with message
router.post("/pushversion", requireAuth, (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { skillId, markdown, message } = req.body as { skillId: number; markdown: string; message: string };
  if (!skillId || !markdown) {
    return res.status(400).json({ error: "Missing skillId or markdown" });
  }
  const msg = (message ?? "").trim();
  if (!msg) {
    return res.status(400).json({ error: "Version message is required" });
  }

  const existingSkill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!existingSkill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  const { data, content } = matter(markdown);
  const name = typeof data.name === "string" ? data.name : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;
  const allowedTools = extractAllowedTools(data as Record<string, unknown>);
  const updatedAt = new Date().toISOString();
  if (!name) {
    return res.status(400).json({ error: "Skill name is required in markdown frontmatter" });
  }

  const insertVersion = db.prepare(`
    INSERT INTO skill_versions (skill_id, version, name, description, content, allowed_tools, created_at, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const getMaxVersion = db.prepare("SELECT MAX(version) as maxVersion FROM skill_versions WHERE skill_id = ?");
  const updateSkill = db.prepare("UPDATE skills SET name = ?, description = ?, content = ?, allowed_tools = ?, updated_at = ? WHERE id = ? AND user_id = ?");

  const run = db.transaction(() => {
    const max = getMaxVersion.get(skillId) as { maxVersion: number | null };
    const nextVersion = (max?.maxVersion ?? 0) + 1;
    insertVersion.run(skillId, nextVersion, name, description, content, JSON.stringify(allowedTools), updatedAt, msg);
    updateSkill.run(name, description, content, JSON.stringify(allowedTools), updatedAt, skillId, userId);
    return nextVersion;
  });

  const version = run();
  return res.status(200).json({ message: "Version pushed successfully", updatedAt, version });
});

// Clone a public skill
router.post("/clonepublicskill", requireAuth, (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { skillId } = req.body as { skillId: number };
  if (!skillId) {
    return res.status(400).json({ error: "Missing skillId" });
  }
  const skill = db.prepare("SELECT * FROM skills WHERE id = ? AND is_public = 1").get(skillId) as markdownFile & { user_id: number } | undefined;
  if (!skill) {
    return res.status(404).json({ error: "Skill not found or not public" });
  }
  const newSkill = db.prepare("INSERT INTO skills (user_id, name, description, content, allowed_tools, cloned_from_user_id) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, skill.name, skill.description, skill.content, JSON.stringify(parseAllowedTools(skill.allowed_tools)), skill.user_id);
  const tags = db.prepare("SELECT tag_id FROM skill_tags WHERE skill_id = ?").all(skillId) as { tag_id: number }[];
  const newSkillId = newSkill.lastInsertRowid as number;
  for (const tag of tags) {
    db.prepare("INSERT INTO skill_tags (skill_id, tag_id) VALUES (?, ?)").run(newSkillId, tag.tag_id);
  }
  return res.status(201).json({ message: "Skill cloned successfully" });
});

// Add a tag to a skill
router.post("/addtag", requireAuth, (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { skillId, tagName } = req.body as { skillId: number; tagName: string };
  if (!skillId || !tagName) {
    return res.status(400).json({ error: "Missing skillId or tagName" });
  }
  const skill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }
  const lowerTagName = tagName.toLowerCase();
  let tag = db.prepare("SELECT * FROM tags WHERE name = ?").get(lowerTagName) as tagRow | undefined;
  if (!tag) {
    const result = db.prepare("INSERT INTO tags (name) VALUES (?)").run(lowerTagName);
    tag = { id: Number(result.lastInsertRowid), name: lowerTagName };
  }
  db.prepare("INSERT INTO skill_tags (skill_id, tag_id) VALUES (?, ?)").run(skillId, tag?.id);
  return res.status(200).json({ message: "Tag added to skill successfully" });
});

// Search skills by tag
router.get("/searchbytag", (req, res) => {
  const { tagName } = req.query as { tagName: string };
  if (!tagName) {
    return res.status(400).json({ error: "Missing tagName" });
  }
  const rows = db.prepare(`
    SELECT
      skills.id,
      skills.name,
      skills.description,
      skills.updated_at AS updatedAt,
      skills.allowed_tools,
      skills.cloned_from_user_id,
      (SELECT username FROM users WHERE id = skills.cloned_from_user_id) AS cloned_from_username,
      users.username AS owner
    FROM skills
    LEFT JOIN skill_tags ON skills.id = skill_tags.skill_id
    LEFT JOIN tags ON skill_tags.tag_id = tags.id
    JOIN users ON skills.user_id = users.id
    WHERE (? = '' OR LOWER (tags.name) LIKE ?) AND skills.is_public = 1
    ORDER BY skills.updated_at DESC
    `).all(tagName, `%${tagName}%`) as (SkillRow & { owner: string })[];
  const skills = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    updatedAt: row.updatedAt,
    allowedTools: parseAllowedTools(row.allowed_tools),
    owner: row.owner,
    cloned_from_user_id: row.cloned_from_user_id,
    cloned_from_username: row.cloned_from_username,
    tag_list: row.tag_list
      ? String(row.tag_list)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  }));
  return res.status(200).json({ skills });
});

// Remove a tag from a skill
router.post("/removetag", requireAuth, (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { skillId, tagName } = req.body as { skillId: number; tagName: string };
  if (!skillId || !tagName) {
    return res.status(400).json({ error: "Missing skillId or tagName" });
  }
  const skill = db.prepare("SELECT * FROM skills WHERE id = ? AND user_id = ?").get(skillId, userId);
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }
  const tag = db.prepare("SELECT * FROM tags WHERE name = ?").get(tagName) as tagRow | undefined;
  if (!tag) {
    return res.status(404).json({ error: "Tag not found" });
  }
  db.prepare("DELETE FROM skill_tags WHERE skill_id = ? AND tag_id = ?").run(skillId, tag.id);
  return res.status(200).json({ message: "Tag deleted from skill successfully" });
});

export default router;

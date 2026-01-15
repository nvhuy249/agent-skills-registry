const API_BASE = "http://localhost:3000/api/skills";

export type Skill = {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  is_public?: boolean;
  allowedTools?: string[];
  owner?: string;
  cloned_from_user_id?: number | null;
  cloned_from_username?: string | null;
  tag_list?: string[] | null;
  download_count?: number;
};

export type SkillDetail = Skill & {
  content: string;
};

export type SkillVersionSummary = {
  version: number;
  createdAt: string;
  name?: string;
  description?: string;
  message?: string;
};

export type SkillVersionDetail = SkillVersionSummary & {
  content: string;
  allowedTools?: string[];
  markdown?: string;
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

export async function loadSkills(): Promise<Skill[]> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }

  const res = await fetch(`${API_BASE}/loadskills`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load skills");
  }

  const data = await res.json();
  const skills = Array.isArray(data.skills) ? data.skills : [];
  return skills.map((skill: any) => ({
    ...skill,
    downloadCount:
      typeof skill.downloadCount === "number"
        ? skill.downloadCount
        : typeof skill.download_count === "number"
          ? skill.download_count
          : undefined,
    latestVersion:
      typeof skill.latestVersion === "number"
        ? skill.latestVersion
        : typeof skill.latest_version === "number"
          ? skill.latest_version
          : undefined,
    allowedTools: parseAllowedTools(skill?.allowedTools ?? skill?.allowed_tools),
    cloned_from_user_id: skill?.cloned_from_user_id ?? null,
    cloned_from_username: skill?.cloned_from_username ?? null,
    tag_list: Array.isArray(skill.tag_list) ? skill.tag_list : [],
  })) as Skill[];
}

export async function loadPublicSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_BASE}/publicskills`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load public skills");
  }

  const data = await res.json();
  const skills = Array.isArray(data.skills) ? data.skills : [];
  return skills.map((skill: any) => ({
    ...skill,
    downloadCount:
      typeof skill.downloadCount === "number"
        ? skill.downloadCount
        : typeof skill.download_count === "number"
          ? skill.download_count
          : undefined,
    latestVersion:
      typeof skill.latestVersion === "number"
        ? skill.latestVersion
        : typeof skill.latest_version === "number"
          ? skill.latest_version
          : undefined,
    allowedTools: parseAllowedTools(skill?.allowedTools ?? skill?.allowed_tools),
    cloned_from_user_id: skill?.cloned_from_user_id ?? null,
    cloned_from_username: skill?.cloned_from_username ?? null,
    tag_list: Array.isArray(skill.tag_list) ? skill.tag_list : [],
  })) as Skill[];
}

export async function uploadSkill(markdown: string): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/uploadskill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ markdown }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to upload skill");
  }
}

export async function deleteSkill(skillId: number): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/deleteskill`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to delete skill");
  }
}

export async function showSkill(skillId: number): Promise<SkillDetail> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/showskill?skillId=${skillId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to show skill");
  }
  const data = await res.json();
  return {
    id: skillId,
    name: data.name,
    description: data.description,
    updatedAt: data.updatedAt ?? "",
    is_public: data.is_public,
    download_count: data.download_count,
    allowedTools: parseAllowedTools(data?.allowedTools ?? data?.allowed_tools),
    content: data.markdown ?? "",
    owner: data.owner,
    cloned_from_user_id: data?.cloned_from_user_id ?? null,
    cloned_from_username: data?.cloned_from_username ?? null,
  } as SkillDetail;
}

export async function showPublicSkill(skillId: number): Promise<SkillDetail> {
  const res = await fetch(`${API_BASE}/showpublicskill?skillId=${skillId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to show public skill");
  }
  const data = await res.json();
  return {
    id: skillId,
    name: data.name,
    description: data.description,
    updatedAt: data.updatedAt ?? "",
    is_public: data.is_public,
    downloadCount: data.download_count,
    allowedTools: parseAllowedTools(data?.allowedTools ?? data?.allowed_tools),
    content: data.markdown ?? "",
    owner: data.owner,
    cloned_from_user_id: data?.cloned_from_user_id ?? null,
    cloned_from_username: data?.cloned_from_username ?? null,
  } as SkillDetail;
}

export async function editSkill(skillId: number, markdown: string): Promise<{ updatedAt?: string }> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/editskill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId, markdown }),
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to edit skill");
  }
  return res.json();
}

export async function loadSkillVersions(skillId: number): Promise<SkillVersionSummary[]> {
  const res = await fetch(`${API_BASE}/loadversions?skillId=${skillId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load versions");
  }
  const data = await res.json();
  const versions = Array.isArray(data.versions) ? data.versions : [];
  return versions.map((v: any) => ({
    version: v.version,
    createdAt: v.createdAt ?? v.created_at ?? "",
    name: v.name,
    description: v.description,
    message: v.message,
  })) as SkillVersionSummary[];
}

export async function showSkillVersion(skillId: number, version: number): Promise<SkillVersionDetail> {
  const res = await fetch(`${API_BASE}/showversion?skillId=${skillId}&version=${version}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load version");
  }
  const data = await res.json();
  return {
    version: data.version,
    createdAt: data.createdAt ?? data.created_at ?? "",
    name: data.name,
    description: data.description,
    content: data.content ?? "",
    markdown: data.markdown ?? "",
    allowedTools: parseAllowedTools(data.allowedTools ?? data.allowed_tools),
    message: data.message,
  };
}

export async function pushSkillVersion(
  skillId: number,
  markdown: string,
  message: string
): Promise<{ updatedAt?: string; version?: number }> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/pushversion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId, markdown, message }),
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to push version");
  }
  return res.json();
}

export async function changePrivacy(skillId: number, is_public: boolean): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/changeprivacy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId, is_public }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to change privacy");
  }
}

export async function downloadPublicSkill(skillId: number): Promise<{ markdown: string; name?: string }> {
  const res = await fetch(`${API_BASE}/downloadskill?skillId=${skillId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to download skill");
  }

  const markdown = await res.text();
  return { markdown };
}

export async function clonePublicSkill(skillId: number): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/clonepublicskill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to clone skill");
  }
}

export async function addTag(skillId: number, tagName: string): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/addtag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId, tagName }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to add tag");
  }
}

export async function removeTag(skillId: number, tagName: string): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/removetag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId, tagName }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to remove tag");
  }
}

export async function searchbytag(tagName: string): Promise<Skill[]> {
  const res = await fetch(`${API_BASE}/searchbytag?tagName=${encodeURIComponent(tagName)}`, {
    method: "GET",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to search skills by tag");
  }

  const data = await res.json();
  const skills = Array.isArray(data.skills) ? data.skills : [];
  return skills.map((skill: any) => ({
    ...skill,
    allowedTools: parseAllowedTools(skill?.allowedTools ?? skill?.allowed_tools),
    cloned_from_user_id: skill?.cloned_from_user_id ?? null,
    cloned_from_username: skill?.cloned_from_username ?? null,
    tag_list: Array.isArray(skill.tag_list) ? skill.tag_list : [],
  })) as Skill[];
}

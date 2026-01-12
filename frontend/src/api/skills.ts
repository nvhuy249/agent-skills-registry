const API_BASE = "http://localhost:3000/api/skills";

export type Skill = {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  is_public?: boolean;
  allowedTools?: string[];
  owner?: string;
};

export type SkillDetail = Skill & {
  content: string;
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
    headers: {
      "user-id": userId,
    },
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
    allowedTools: parseAllowedTools(skill?.allowedTools ?? skill?.allowed_tools),
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
    allowedTools: parseAllowedTools(skill?.allowedTools ?? skill?.allowed_tools),
  })) as Skill[];
}

export async function uploadSkill( markdown: string ): Promise<void> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/uploadskill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId,
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
      "user-id": userId,
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
    headers: {
      "user-id": userId,
    },
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
    allowedTools: parseAllowedTools(data?.allowedTools ?? data?.allowed_tools),
    content: data.markdown ?? "",
  } as SkillDetail;
}

export async function editSkill( skillId: number, markdown: string ): Promise<{ updatedAt?: string }> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }
  const res = await fetch(`${API_BASE}/editskill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId,
    },
    body: JSON.stringify({ skillId, markdown}),
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to edit skill");
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
      "user-id": userId,
    },
    body: JSON.stringify({ skillId, is_public }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to change privacy");
  }
}

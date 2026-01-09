const API_BASE = "http://localhost:3000/api/skills";

export type Skill = {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  is_public?: boolean;
};

export async function loadSkills(): Promise<Skill[]> {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("Not logged in: missing userId");
  }

  const res = await fetch(`${API_BASE}/loadskills`, {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load skills");
  }

  const data = await res.json();
  return (data.skills as Skill[]) ?? [];
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
      "x-user-id": userId,
    },
    body: JSON.stringify({ markdown }),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to upload skill");
  }
}

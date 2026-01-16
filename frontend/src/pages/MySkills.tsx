import { useRef, useState, useEffect, useCallback } from "react";
import SkillCard, { type Skill } from "../components/SkillCard";
import { useNavigate } from "react-router-dom";
import { loadSkills, uploadSkill, deleteSkill, changePrivacy, addTag } from "../api/skills";
import { logout as apiLogout } from "../api/auth";

export default function MySkills() {
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [searchNamePrivate, setSearchNamePrivate] = useState("");
  const [searchTagPrivate, setSearchTagPrivate] = useState("");
  const [searchNamePublic, setSearchNamePublic] = useState("");
  const [searchTagPublic, setSearchTagPublic] = useState("");
  const [sortPrivate, setSortPrivate] = useState<"recent" | "name-asc" | "name-desc">("recent");
  const [sortPublic, setSortPublic] = useState<"recent" | "name-asc" | "name-desc">("recent");

  const refreshSkills = useCallback(async () => {
    const showSpinner = skills.length === 0;
    if (showSpinner) setLoading(true);
    try {
      const data = await loadSkills();
      setSkills(data);
    } catch (err: any) {
      setError(err.message || "Failed to load skills");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [skills.length]);

  useEffect(() => {
    refreshSkills();
  }, [refreshSkills]);

  useEffect(() => {
    const nextTags = Array.from(new Set(skills.flatMap((skill) => skill.tag_list ?? [])));
    setTags((prev) => {
      if (prev.length === nextTags.length && prev.every((tag, idx) => tag === nextTags[idx])) {
        return prev;
      }
      return nextTags;
    });
  }, [skills]);

  const skillsPrivate = skills.filter((skill) => !skill.is_public);
  const skillsPublic = skills.filter((skill) => skill.is_public);

  // Search by name and tag now are handled on frontend for simplicity

  const filterByName = (list: Skill[], query: string) =>
    list.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  const filterByTag = (list: Skill[], query: string) => {
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter((s) => (s.tag_list ?? []).some((t) => t.toLowerCase().includes(term)));
  };

  const sortSkills = useCallback((list: Skill[], sort: "recent" | "name-asc" | "name-desc") => {
    const copy = [...list];
    if (sort === "name-asc") return copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc") return copy.sort((a, b) => b.name.localeCompare(a.name));
    return copy.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, []);

  const filteredPrivate = sortSkills(
    filterByTag(filterByName(skillsPrivate, searchNamePrivate), searchTagPrivate),
    sortPrivate
  );
  const filteredPublic = sortSkills(
    filterByTag(filterByName(skillsPublic, searchNamePublic), searchTagPublic),
    sortPublic
  );

  const username = localStorage.getItem("username");

  function openUploadPicker() {
    uploadInputRef.current?.click();
  }

  function openEditPicker(skill: Skill) {
    navigate(`/skills/${skill.id}/edit`);
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    const markdown = await file.text();
    const tempId = crypto.randomUUID();
    const optimistic: Skill = {
      id: tempId as unknown as number,
      name: file.name,
      description: "",
      updatedAt: new Date().toISOString(),
      is_public: false,
    };
    setSkills((prev) => [optimistic, ...prev]);

    try {
      await uploadSkill(markdown);
      await refreshSkills();
    } catch (err) {
      setSkills((prev) => prev.filter((skill) => skill.id !== (tempId as unknown as number)));
      setError((err as Error).message || "Failed to upload skill");
    } finally {
    event.target.value = "";
    }
  }

  async function handleDeleteChange(skill: Skill) {
    const confirm = window.confirm(`Are you sure you want to delete the skill "${skill.name}"? This action cannot be undone.`);
    if (!confirm) return;
    
    const prev = skills;
    setSkills((prev) => (prev.filter((s) => s.id !== skill.id)));
    try {
      await deleteSkill(skill.id);
    } catch (err) {
      setSkills(prev);
      setError((err as Error).message || "Failed to delete skill");
    }
  }

  async function onChangePrivacy(skill: Skill) {
    const privacyAction = skill.is_public ? "private" : "public";
    const confirm = window.confirm(`Are you sure you want to make the skill "${skill.name}" ${privacyAction}?`);
    if (!confirm) return;
    const prev = skills;
    setSkills((prev) => 
      prev.map((s) => 
        s.id === skill.id ? { ...s, is_public: !s.is_public } : s
      )
    );
    try {
      await changePrivacy(skill.id, !skill.is_public);
    } catch (err) {
      setSkills(prev);
      setError((err as Error).message || "Failed to change privacy");
    }
  }

  async function handleAddTag(skillId: number, tagName: string) {
    const tag = tagName.trim();
    if (!tag) return;
    const prev = skills;
    setSkills((p) =>
      p.map((s) =>
        s.id === skillId
          ? { ...s, tag_list: Array.from(new Set([...(s.tag_list ?? []), tag])) }
          : s
      )
    );
    try {
      await addTag(skillId, tag);
    } catch (err) {
      setSkills(prev);
      setError((err as Error).message || "Failed to add tag");
    }
  }

  async function handleLogout() {
    const confirm = window.confirm("Are you sure you want to log out?");
    if (!confirm) return;
    await apiLogout().catch(() => null);
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-8">
      {/* Account section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Signed in as</p>
            <h1 className="text-2xl font-semibold text-white">@{username}</h1>
            <p className="mt-1 text-slate-400">Welcome back, ready to manage your skills?</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openUploadPicker}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            >
              Upload skill
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-400 hover:text-rose-200"
            >
              Log out
            </button>
          </div>
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleUploadChange}
        />
      </section>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100 shadow">
          {error}
        </div>
      )}

      {/* Skills section */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200 shadow-sm shadow-slate-900/30">
            Loading your skills...
          </div>
        ) : (
          <>
            <SkillsColumn
              title="Private Skills"
              subtitle="Only you can view these skills."
              skills={filteredPrivate}
              onEdit={openEditPicker}
              onDelete={handleDeleteChange}
              onChangePrivacy={onChangePrivacy}
              onAddTag={handleAddTag}
              searchName={searchNamePrivate}
              onSearchNameChange={setSearchNamePrivate}
              searchTag={searchTagPrivate}
              onSearchTagChange={setSearchTagPrivate}
              sortBy={sortPrivate}
              onSortChange={setSortPrivate}
              tags={tags}
              onTagSelect={setSearchTagPrivate}
            />
            <SkillsColumn
              title="Public Skills"
              subtitle="Visible to everyone."
              skills={filteredPublic}
              onEdit={openEditPicker}
              onDelete={handleDeleteChange}
              onChangePrivacy={onChangePrivacy}
              onAddTag={handleAddTag}
              searchName={searchNamePublic}
              onSearchNameChange={setSearchNamePublic}
              searchTag={searchTagPublic}
              onSearchTagChange={setSearchTagPublic}
              sortBy={sortPublic}
              onSortChange={setSortPublic}
              tags={tags}
              onTagSelect={setSearchTagPublic}
            />
          </>
        )}
      </section>
    </div>
  );
}

type SkillsColumnProps = {
  title: string;
  subtitle: string;
  skills: Skill[];
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  onChangePrivacy?: (skill: Skill) => void;
  onAddTag?: (skillId: number, tagName: string) => void;
  searchName: string;
  onSearchNameChange: (value: string) => void;
  searchTag: string;
  onSearchTagChange: (value: string) => void;
  sortBy: "recent" | "name-asc" | "name-desc";
  onSortChange: (value: "recent" | "name-asc" | "name-desc") => void;
  tags?: string[];
  onTagSelect?: (tag: string) => void;
};

function SkillsColumn({
  title,
  subtitle,
  skills,
  onEdit,
  onDelete,
  onChangePrivacy,
  onAddTag,
  searchName,
  onSearchNameChange,
  searchTag,
  onSearchTagChange,
  sortBy,
  onSortChange,
  tags,
  onTagSelect,
}: SkillsColumnProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm shadow-slate-900/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200"
        >
          <option value="recent">Most Recently Updated</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>

      <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="search"
            value={searchName}
            onChange={(e) => onSearchNameChange(e.target.value)}
            placeholder="Search by name..."
            className="w-full max-w-45 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
          />
          <input
            type="search"
            value={searchTag}
            onChange={(e) => onSearchTagChange(e.target.value)}
            placeholder="Search by tag..."
            className="w-full max-w-45 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
          />
        </div>

        {tags?.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Tags:</span>
            {tags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => (onTagSelect ? onTagSelect(tag) : onSearchTagChange(tag))}
                className="rounded-full border border-slate-700 px-2 py-1 text-slate-200 transition hover:border-indigo-400 hover:text-indigo-200"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}

        {skills.length === 0 ? (
          <p className="text-sm text-slate-400">No skills yet.</p>
        ) : (
          skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangePrivacy={onChangePrivacy}
              onAddTag={onAddTag}
            />
          ))
        )}
      </div>
    </div>
  );
}


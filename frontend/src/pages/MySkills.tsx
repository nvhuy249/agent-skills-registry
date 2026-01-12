import { useRef, useState, useEffect, useCallback } from "react";
import SkillCard, { type Skill } from "../components/SkillCard";
import { useNavigate } from "react-router-dom";
import { loadSkills, uploadSkill, deleteSkill, changePrivacy } from "../api/skills";

export default function MySkills() {
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

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

  const skillsPrivate = skills.filter((skill) => !skill.is_public);
  const skillsPublic = skills.filter((skill) => skill.is_public);

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

  function handleLogout() {
    const confirm = window.confirm("Are you sure you want to log out?");
    if (!confirm) return;
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
              skills={skillsPrivate}
              onEdit={openEditPicker}
              onDelete={handleDeleteChange}
              onChangePrivacy={onChangePrivacy}
            />
            <SkillsColumn
              title="Public Skills"
              subtitle="Visible to everyone."
              skills={skillsPublic}
              onEdit={openEditPicker}
              onDelete={handleDeleteChange}
              onChangePrivacy={onChangePrivacy}
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
};

function SkillsColumn({ title, subtitle, skills, onEdit, onDelete, onChangePrivacy }: SkillsColumnProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm shadow-slate-900/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200"
            onClick={() => console.log("Filter", title)}
          >
            Filter
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200"
            onClick={() => console.log("Sort", title)}
          >
            Sort
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
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
            />
          ))
        )}
      </div>
    </div>
  );
}

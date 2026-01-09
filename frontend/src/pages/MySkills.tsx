import { useRef, useState, useEffect } from "react";
import SkillCard, { type Skill } from "../components/SkillCard";
import { useNavigate } from "react-router-dom";
import { loadSkills } from "../api/skills";
import { uploadSkill } from "../api/skills";

export default function MySkills() {
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [editTarget, setEditTarget] = useState<Skill | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadSkills()
      .then((data) => {
        if (active) setSkills(data);})
      .catch((err) => {
        if (active) setError(err.message);})
      .finally(() => {
        if (active) setLoading(false);});
    return () => {
      active = false;
    };
  }, []);

  const skillsPrivate = skills.filter((skill) => !skill.is_public);
  const skillsPublic = skills.filter((skill) => skill.is_public);

  const username = localStorage.getItem("username");

  function openUploadPicker() {
    uploadInputRef.current?.click();
  }

  function openEditPicker(skill: Skill) {
    setEditTarget(skill);
    editInputRef.current?.click();
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = "";
      return;
    }
    if (file) {
      console.log("Upload skill file:", file.name);
    }
    const markdown = await file.text();
    await uploadSkill(markdown);
    event.target.value = "";
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && editTarget) {
      console.log("Edit skill", editTarget.id, "with file", file.name);
    }
    setEditTarget(null);
    event.target.value = "";
  }

  function handleLogout() {
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
        <input
          ref={editInputRef}
          type="file"
          accept=".md,.txt,.pdf,.json"
          className="hidden"
          onChange={handleEditChange}
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
              onDelete={(skill) => console.log("Delete skill", skill.id)}
            />
            <SkillsColumn
              title="Public Skills"
              subtitle="Visible to everyone."
              skills={skillsPublic}
              onEdit={openEditPicker}
              onDelete={(skill) => console.log("Delete skill", skill.id)}
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
};

function SkillsColumn({ title, subtitle, skills, onEdit, onDelete }: SkillsColumnProps) {
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
            />
          ))
        )}
      </div>
    </div>
  );
}

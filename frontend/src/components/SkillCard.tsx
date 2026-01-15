import { useEffect, useRef, useState } from "react";

export type Skill = {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  is_public?: boolean;
  allowedTools?: string[];
  cloned_from_user_id?: number | null;
  cloned_from_username?: string | null;
  tag_list?: string[] | null;
  download_count?: number;
};

type Props = {
  skill: Skill;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
  onChangePrivacy?: (skill: Skill) => void;
  onAddTag?: (skillId: number, tagName: string) => Promise<void> | void;
};

export default function SkillCard({ skill, onEdit, onDelete, onChangePrivacy, onAddTag }: Props) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [adding, setAdding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tags = skill.tag_list ?? [];
  const downloadCount = typeof skill.download_count === "number" ? skill.download_count : 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTagsOpen(false);
        setAddTagOpen(false);
      }
    }
    if (tagsOpen || addTagOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagsOpen, addTagOpen]);

  async function handleSubmitTag() {
    if (!onAddTag) return;
    const tag = newTag.trim();
    if (!tag) return;
    setAdding(true);
    try {
      await onAddTag(skill.id, tag);
      setNewTag("");
      setAddTagOpen(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
          {skill.description ? (
            <p className="mt-1 text-sm text-slate-400">{skill.description}</p>
          ) : null}
          {skill.cloned_from_username || skill.cloned_from_user_id ? (
            <p className="mt-1 text-xs text-indigo-200">
              Cloned from @{skill.cloned_from_username ?? skill.cloned_from_user_id}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Updated: {skill.updatedAt}</span>
            {skill.is_public ? (
              <span className="flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-100">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a.75.75 0 0 1 .75.75v7.19l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0l-3.75-3.75a.75.75 0 0 1 1.06-1.06l2.47 2.47V3.75A.75.75 0 0 1 10 3Zm-5 11.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{downloadCount}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
              {skill.is_public ? "Public" : "Private"}
          </span>
          <div
            className="relative"
            onMouseEnter={() => setTagsOpen(true)}
            onMouseLeave={() => setTagsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="rounded-lg border border-slate-700 px-2 py-2 text-xs font-semibold text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            >
              {tags.length ? `${tags.length} tag${tags.length === 1 ? "" : "s"}` : "Tags"}{" "}
            </button>
            {tagsOpen ? (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl shadow-black/40"
              >
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <span className="text-xs text-slate-400">No tags available.</span>
                  ) : null}
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              className="w-full rounded-md border border-indigo-500/60 px-1 py-1 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/10"
              onClick={() => setAddTagOpen(true)}
            >
              Add tag
            </button>
            {addTagOpen ? (
              <>
                <div
                  ref={menuRef}
                  className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl shadow-black/40"
                >
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSubmitTag();
                      }
                    }}
                    placeholder="Tag name"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-indigo-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-md border border-indigo-500/60 px-2 py-1 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/10 disabled:opacity-50"
                      disabled={!newTag.trim() || adding}
                      onClick={() => void handleSubmitTag()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-rose-400 hover:text-rose-200"
                      onClick={() => {
                        setNewTag("");
                        setAddTagOpen(false);
                      }}
                      disabled={adding}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(skill)}
            className="rounded-lg border border-indigo-500/60 px-3 py-2 text-indigo-200 transition hover:bg-indigo-500/10"
          >
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(skill)}
            className="rounded-lg border border-rose-500/60 px-3 py-2 text-rose-200 transition hover:bg-rose-500/10"
          >
            Delete
          </button>
        ) : null}
        {onChangePrivacy ? (
          <button
            type="button"
            onClick={() => onChangePrivacy(skill)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200"
          >
            {skill.is_public ? "Make Private" : "Make Public"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import type { Skill } from "./SkillCard";

type Props = {
  skill: Skill & { owner?: string };
  onView?: (skill: Skill) => void;
  onDownload?: (skill: Skill) => void;
  onClone?: (skill: Skill) => void;
};

export default function PublicSkillCard({ skill, onView, onDownload, onClone }: Props) {
  const [open, setOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);
  const tags = skill.tag_list ?? [];
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm shadow-slate-900/40 transition hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/30">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
          {skill.description ? (
            <p className="text-sm text-slate-300/90">{skill.description}</p>
          ) : null}
          <p className="text-xs text-slate-500">Updated: {skill.updatedAt}</p>
        </div>
        <div className="flex items-start gap-2">
          <div
            className="relative"
            onMouseEnter={() => setTagsOpen(true)}
            onMouseLeave={() => setTagsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            >
              {tags.length ? `${tags.length} tag${tags.length === 1 ? "" : "s"}` : "Tags"}
            </button>
            {tagsOpen ? (
              <div
                ref={tagsRef}
                className="absolute left-0 top-12 z-20 w-52 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl shadow-black/40"
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
          <div className="flex-row-1 flex-row items-end gap-2 space-y-4">
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase text-slate-200">
                Owner
              </span>
              {skill.owner ? (
                <span className="flex rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-500/30">
                  {skill.owner}
                </span>
              ) : null}
            </div>
            {skill.cloned_from_user_id || skill.cloned_from_username ? (
              <span className="flex-row-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                Cloned from @{skill.cloned_from_username ?? skill.cloned_from_user_id}
              </span>
            ) : null}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-md border border-slate-700 px-2 py-1 text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            >
              ⋯
            </button>
            {open ? (
              <div
                className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/70 z-50"
                style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onView?.(skill);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDownload?.(skill);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClone?.(skill);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
                >
                  Clone to My Skills
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

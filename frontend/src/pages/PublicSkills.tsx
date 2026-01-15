import { useEffect, useState, useCallback, use } from "react";
import { useNavigate } from "react-router-dom";
import { loadPublicSkills, downloadPublicSkill, clonePublicSkill, searchbytag, type Skill } from "../api/skills";
import PublicSkillCard from "../components/PublicSkillCard";

export default function PublicSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [cloneMessage, setCloneMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [cloningId, setCloningId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name-asc" | "name-desc">("recent");
  const [filter, setFilter] = useState<"all" | "with-description">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadPublicSkills();
      setSkills(data);
      setTags(Array.from(new Set(data.flatMap((skill) => skill.tag_list ?? []))));
    } catch (err: any) {
      setError(err.message || "Failed to load public skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = skills
    .filter((skill) =>
      skill.name.toLowerCase().includes(search.toLowerCase().trim())
    )
    .filter((skill) =>
      filter === "with-description" ? Boolean(skill.description && skill.description.trim()) : true
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });

  // NOTE: Public skills are fetched once and paginated client-side.
  // This is intentional for simplicity given expected dataset size.

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const searchTagResults = useCallback(async () => {
    const tag = searchTag.trim().toLowerCase();
    if (!tag) {
      refresh();
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const data = await searchbytag(tag);
        setSkills(data);
      } catch (err: any) {
        setError(err.message || "Failed to load public skills by tag");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTag, refresh]);

  useEffect(() => {
    searchTagResults();
  }, [searchTag, searchTagResults]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, filter, skills]);

  function handleView(skill: Skill) {
    navigate(`/public/${skill.id}/view`, { state: { owner: skill.owner } });
  }

  async function handleDownload(skill: Skill) {
    setDownloadError(null);
    setDownloadingId(skill.id);
    try {
      const { markdown } = await downloadPublicSkill(skill.id);
      const safeBase =
        (skill.name || `skill-${skill.id}`)
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-") || `skill-${skill.id}`;
      const filename = safeBase.toLowerCase().endsWith(".md") ? safeBase : `${safeBase}.md`;
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download skill");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleClone(skill: Skill) {
    if (cloningId) return;
    setCloneError(null);
    setCloneMessage(null);
    setCloningId(skill.id);
    try {
      await clonePublicSkill(skill.id);
      setCloneMessage(`Cloned "${skill.name}" to your skills. Check My Skills.`);
    } catch (err: any) {
      setCloneError(err.message || "Failed to clone skill");
    } finally {
      setCloningId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Public Skills</h1>
        <p className="text-sm text-slate-400">
          Browse skills shared by everyone.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm shadow-slate-900/30">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full max-w-50 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
          />
          <input
            type="search"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Search by tag..."
            className="w-full max-w-50 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
          >
            <option value="recent">Most Recently Updated</option>
            <option value="name-asc">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500"
          >
            <option value="all">All skills</option>
            <option value="with-description">Has description</option>
          </select>
          <button
            type="button"
            onClick={refresh}
            className="ml-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {downloadingId ? (
          <p className="mt-2 text-xs text-slate-400">Downloading skill #{downloadingId}...</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100 shadow">
          {error}
        </div>
      ) : null}
      {downloadError ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-100 shadow">
          {downloadError}
        </div>
      ) : null}
      {cloneError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100 shadow">
          {cloneError}
        </div>
      ) : null}
      {cloneMessage ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-100 shadow">
          {cloneMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200 shadow-sm shadow-slate-900/30">
          Loading public skills...
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm shadow-slate-900/30 overflow-hidden">
          <div className="grid grid-cols-1 gap-4">
            {visible.length === 0 ? (
              <p className="text-sm text-slate-400">No public skills match your search.</p>
            ) : (
              visible.map((skill) => (
                <PublicSkillCard
                  key={skill.id}
                  skill={skill}
                  onView={handleView}
                  onDownload={handleDownload}
                  onClone={handleClone}
                />
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <span>
              Page {currentPage} of {totalPages} • {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-slate-700 px-3 py-1 text-slate-100 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-200"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-slate-700 px-3 py-1 text-slate-100 disabled:opacity-40 hover:border-indigo-400 hover:text-indigo-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

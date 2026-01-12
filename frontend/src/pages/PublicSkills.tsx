import { useEffect, useState, useCallback } from "react";
import { loadPublicSkills, type Skill } from "../api/skills";
import PublicSkillCard from "../components/PublicSkillCard";

export default function PublicSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name-asc" | "name-desc">("recent");
  const [filter, setFilter] = useState<"all" | "with-description">("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadPublicSkills();
      setSkills(data);
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

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, filter, skills]);

  function handleView(skill: Skill) {
    console.log("View public skill", skill.id);
  }

  function handleDownload(skill: Skill) {
    console.log("Download public skill", skill.id);
  }

  function handleClone(skill: Skill) {
    console.log("Clone public skill", skill.id);
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
            className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
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
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100 shadow">
          {error}
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

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { showPublicSkill, loadSkillVersions, showSkillVersion, type SkillVersionSummary } from "../api/skills";

export default function ViewSkill() {
  const { id } = useParams<{ id: string }>();
  const skillId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { owner?: string } | null;

  const [skillName, setSkillName] = useState<string | undefined>();
  const [content, setContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | undefined>(state?.owner);
  const [clonedFromUserId, setClonedFromUserId] = useState<number | null>(null);
  const [clonedFromUsername, setClonedFromUsername] = useState<string | null>(null);
  const [versions, setVersions] = useState<SkillVersionSummary[]>([]);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [openVersion, setOpenVersion] = useState<{ version: number; content: string; name?: string } | null>(null);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!skillId) {
      setError("Invalid skill id");
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await showPublicSkill(skillId);
        if (!mounted) return;
        setSkillName(data.name);
        setContent(data.content);
        setLastUpdated(data.updatedAt ?? null);
        setIsPublic(Boolean(data.is_public ?? true));
        setAllowedTools(data.allowedTools ?? []);
        setOwner((prev) => prev ?? data.owner);
        setClonedFromUserId(data.cloned_from_user_id ?? null);
        setClonedFromUsername(data.cloned_from_username ?? null);
        setVersionsError(null);
        setVersionsLoading(true);
        try {
          const history = await loadSkillVersions(skillId);
          if (mounted) setVersions(history);
        } catch (err: any) {
          if (mounted) setVersionsError(err.message || "Failed to load versions");
        } finally {
          if (mounted) setVersionsLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to load skill");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [skillId]);

  if (loading) return <div className="text-slate-200">Loading...</div>;
  if (error && !content) return <div className="text-rose-200">{error}</div>;

  async function handleToggleViewVersion(version: number) {
    if (openVersion?.version === version) {
      setOpenVersion(null);
      return;
    }
    setLoadingVersion(version);
    setVersionsError(null);
    try {
      const detail = await showSkillVersion(skillId, version);
      setOpenVersion({
        version,
        content: detail.markdown ?? detail.content ?? "",
        name: detail.name,
      });
    } catch (err: any) {
      setVersionsError(err.message || "Failed to load version");
    } finally {
      setLoadingVersion(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{skillName ?? "View Skill"}</h1>
          <p className="text-sm text-slate-400">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Unknown"}
          </p>
          <p className="text-xs text-slate-400">Read-only view</p>
        </div>
        <div className="flex items-center gap-2">
          {owner ? (
            <span className="rounded-full border border-indigo-500/50 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              Owner: {owner}
            </span>
          ) : null}
          {clonedFromUserId || clonedFromUsername ? (
            <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
              Cloned from @{clonedFromUsername ?? clonedFromUserId}
            </span>
          ) : null}
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isPublic
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-800/70 text-slate-200"
            }`}
          >
            {isPublic ? "Public" : "Private"}
          </span>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-slate-500"
          >
            Back
          </button>
        </div>
      </div>

      {allowedTools.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200">
            Allowed tools
          </span>
          {allowedTools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-100"
            >
              {tool}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-rose-500/50 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <textarea
        className="w-full min-h-[60vh] rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500"
        value={content}
        readOnly
        spellCheck={false}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Version history</h2>
            <p className="text-xs text-slate-400">Read-only history of this public skill.</p>
          </div>
        </div>
        {versionsError ? (
          <div className="mt-2 rounded-md border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
            {versionsError}
          </div>
        ) : null}
        {versionsLoading ? (
          <p className="mt-2 text-xs text-slate-400">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No versions yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-800/70">
            {versions.map((v) => (
              <div key={v.version} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">v{v.version}</p>
                  {v.message ? (
                    <p className="text-xs text-slate-300">Message: {v.message}</p>
                  ) : null}
                  <p className="text-xs text-slate-400">
                    {v.createdAt ? new Date(v.createdAt).toLocaleString() : "Unknown date"}
                  </p>
                  {v.description ? (
                    <p className="text-xs text-slate-400">"{v.description}"</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleViewVersion(v.version)}
                  disabled={loadingVersion === v.version}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                    openVersion?.version === v.version
                      ? "border-rose-500/60 text-rose-200 hover:bg-rose-500/10"
                      : "border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  {loadingVersion === v.version
                    ? "Loading..."
                    : openVersion?.version === v.version
                    ? "Close version"
                    : "View version"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {openVersion ? (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-4 shadow-sm shadow-black/40">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                Viewing version {openVersion.version}
              </p>
              <p className="text-xs text-emerald-200/80">
                Read-only snapshot{openVersion.name ? `: ${openVersion.name}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenVersion(null)}
              className="rounded-md border border-rose-500/60 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/10"
            >
              Close version
            </button>
          </div>
          <textarea
            className="w-full min-h-[40vh] rounded-lg border border-emerald-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none"
            value={openVersion.content}
            readOnly
            spellCheck={false}
          />
        </div>
      ) : null}

    </div>
  );
}

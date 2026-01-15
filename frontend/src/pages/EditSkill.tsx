import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  showSkill,
  editSkill,
  changePrivacy,
  loadSkillVersions,
  showSkillVersion,
  pushSkillVersion,
  type SkillVersionSummary,
} from "../api/skills";

type SaveStatus = "idle" | "saving" | "saved" | "failed";
const draftKey = (id: number) => `skillDraft:${id}`;

export default function EditSkill() {
  const { id } = useParams<{ id: string }>();
  const skillId = Number(id);
  const navigate = useNavigate();

  const [skillName, setSkillName] = useState<string | undefined>();
  const [editorValue, setEditorValue] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [is_public, setIsPublic] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [clonedFromUserId, setClonedFromUserId] = useState<number | null>(null);
  const [clonedFromUsername, setClonedFromUsername] = useState<string | null>(null);
  const [versions, setVersions] = useState<SkillVersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);

  const fetchVersions = useCallback(async () => {
    setVersionsLoading(true);
    setVersionsError(null);
    try {
      const list = await loadSkillVersions(skillId);
      setVersions(list);
    } catch (err: any) {
      setVersionsError(err.message || "Failed to load version history");
    } finally {
      setVersionsLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await showSkill(skillId);
        if (!mounted) return;
        setSkillName(data.name);
        setLastSavedContent(data.content);
        setLastSavedAt(data.updatedAt);
        setIsPublic(!!data.is_public);
        setClonedFromUserId(data.cloned_from_user_id ?? null);
        setClonedFromUsername(data.cloned_from_username ?? null);
        void fetchVersions();
        const draft = localStorage.getItem(draftKey(skillId));
        if (draft) {
          setEditorValue(draft);
          setDraftLoaded(true);
        } else {
          setEditorValue(data.content);
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
  }, [skillId, fetchVersions]);

  const isDirty = useMemo(() => editorValue !== lastSavedContent, [editorValue, lastSavedContent]);

  useEffect(() => {
    if (!skillId || loading || !autoSaveEnabled) return;
    localStorage.setItem(draftKey(skillId), editorValue);
  }, [editorValue, skillId, loading, autoSaveEnabled]);

  useEffect(() => {
    if (!isDirty || autoSaveEnabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, autoSaveEnabled]);

  const save = useCallback(
    async (opts?: { silent?: boolean }) => {
      setStatus("saving");
      setError(null);
      try {
        const res = await editSkill(skillId, editorValue);
        setLastSavedContent(editorValue);
        setLastSavedAt(res.updatedAt ?? new Date().toISOString());
        localStorage.removeItem(draftKey(skillId));
        setDraftLoaded(false);
        setStatus("saved");
        if (!opts?.silent) setTimeout(() => setStatus("idle"), 1200);
      } catch (err: any) {
        setStatus("failed");
        setError(err.message || "Save failed");
      }
    },
    [skillId, editorValue]
  );

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || loading) return;
    const t = setTimeout(() => {
      void save({ silent: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [autoSaveEnabled, isDirty, save, loading]);

  const [openVersion, setOpenVersion] = useState<{
    version: number;
    content: string;
    name?: string;
  } | null>(null);

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

  async function handlePushVersion() {
    if (pushing) return;
    const message = window.prompt("Enter a message to commit:");
    if (message === null) return;
    const msg = message.trim();
    if (!msg) {
      setPushError("Message is required to commit.");
      return;
    }
    setPushError(null);
    setStatus("saving");
    setPushing(true);
    try {
      const res = await pushSkillVersion(skillId, editorValue, msg);
      setLastSavedContent(editorValue);
      setLastSavedAt(res.updatedAt ?? new Date().toISOString());
      localStorage.removeItem(draftKey(skillId));
      setDraftLoaded(false);
      setStatus("saved");
      void fetchVersions();
      setTimeout(() => setStatus("idle"), 1200);
    } catch (err: any) {
      setStatus("failed");
      setPushError(err.message || "Failed to push version");
    } finally {
      setPushing(false);
    }
  }

  if (loading) return <div className="text-slate-200">Loading...</div>;
  if (error && !lastSavedContent) return <div className="text-rose-200">{error}</div>;

  const onBack = () => {
    if (!autoSaveEnabled && isDirty) {
      const ok = window.confirm("You have unsaved changes. Save before leaving?");
      if (!ok) return;
    }
    navigate(-1);
  };

  const onReset = () => {
    setEditorValue(lastSavedContent);
    localStorage.removeItem(draftKey(skillId));
    setDraftLoaded(false);
    setStatus("idle");
  }; // NOT WORKING RIGHT NOW
  
  const onPrivacyChange = () => {
    const privacyAction = is_public ? "private" : "public";
    const confirm = window.confirm(`Are you sure you want to make the skill "${skillName}" ${privacyAction}?`);
    if (!confirm) return;
    const newPrivacy = !is_public;
    setIsPublic(newPrivacy);
    changePrivacy(skillId, newPrivacy).catch((err) => {
      setError(err.message || "Failed to change privacy");
      setIsPublic(!newPrivacy); // revert on error
    })
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{skillName ?? "Edit Skill"}</h1>
          <p className="text-sm text-slate-400">
            Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "Unknown"}
          </p>
            {clonedFromUserId || clonedFromUsername ? (
              <p className="text-xs text-indigo-200">
                Cloned from @{clonedFromUsername ?? clonedFromUserId}
              </p>
            ) : null}
            {draftLoaded ? <p className="text-xs text-amber-300">Draft loaded from this browser</p> : null}
        </div>
        <div>
          <button 
            type="button" 
            className="mr-4 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            disabled={status === "saving" || pushing}
            onClick={onPrivacyChange}>
            {is_public ? "Make Private" : "Make Public"}
          </button>
        </div>
        <div>
          <button
            type="button"
            className={`mr-4 rounded-md border border-slate-700 px-3 py-2 text-sm disabled:opacity-60 ${
              autoSaveEnabled
                ? "text-emerald-300 hover:text-emerald-200 hover:border-emerald-400"
                : "text-rose-300 hover:text-rose-200 hover:border-rose-400"
            }`}
            disabled={status === "saving" || pushing}
            onClick={() => setAutoSaveEnabled((prev) => !prev)}
          >
            {autoSaveEnabled ? "Auto-Save On" : "Auto-Save Off"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            disabled={status === "saving" || pushing}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={status === "saving" || pushing}
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void handlePushVersion()}
            className="rounded-md border border-indigo-500/60 px-3 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-60"
            disabled={status === "saving" || pushing}
          >
            Push version
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-slate-500"
          >
            Back
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-rose-500/50 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      {pushError ? (
        <div className="rounded border border-amber-500/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-100">
          {pushError}
        </div>
      ) : null}

      <textarea
        className="w-full min-h-[60vh] rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500"
        value={editorValue}
        onChange={(e) => setEditorValue(e.target.value)}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/40">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Version history</h2>
            <p className="text-xs text-slate-400">Revert by loading a previous version into the editor.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchVersions()}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200 disabled:opacity-60"
            disabled={versionsLoading}
          >
            Refresh
          </button>
        </div>
        {versionsError ? (
          <div className="mb-2 rounded-md border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
            {versionsError}
          </div>
        ) : null}
        {versionsLoading ? (
          <p className="text-xs text-slate-400">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-slate-400">No versions yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {versions.map((v) => (
              <div key={v.version} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">version {v.version}</p>
                  {v.message ? (
                    <p className="text-xs text-slate-300">Message: "{v.message}"</p>
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

function StatusBadge({ status }: { status: SaveStatus }) {
  const text =
    status === "saving"
      ? "Saving..."
      : status === "saved"
      ? "Saved"
      : status === "failed"
      ? "Save failed"
      : "Idle";
  const cls =
    status === "saving"
      ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
      : status === "saved"
      ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
      : status === "failed"
      ? "bg-rose-500/20 text-rose-200 border-rose-500/40"
      : "bg-slate-700/40 text-slate-200 border-slate-600";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

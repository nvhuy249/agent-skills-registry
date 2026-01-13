import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { showSkill, editSkill, changePrivacy } from "../api/skills";

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
  }, [skillId]);

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

  if (loading) return <div className="text-slate-200">Loading…</div>;
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
            Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "—"}
          </p>
          {draftLoaded ? <p className="text-xs text-amber-300">Draft loaded from this browser</p> : null}
        </div>
        <div>
          <button 
            type="button" 
            className="mr-4 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            disabled={status === "saving"}
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
            disabled={status === "saving"}
            onClick={() => setAutoSaveEnabled((prev) => !prev)}
          >
            {autoSaveEnabled ? "Auto-Save On" : "Auto-Save Off"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
            disabled={status === "saving"}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={status === "saving"}
          >
            Save
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

      <textarea
        className="w-full min-h-[60vh] rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500"
        value={editorValue}
        onChange={(e) => setEditorValue(e.target.value)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: SaveStatus }) {
  const text =
    status === "saving"
      ? "Saving…"
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

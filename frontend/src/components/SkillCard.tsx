export type Skill = {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  is_public?: boolean;
  allowedTools?: string[];
};

type Props = {
  skill: Skill;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
  onChangePrivacy?: (skill: Skill) => void;
};

export default function SkillCard({ skill, onEdit, onDelete, onChangePrivacy }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-slate-900/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
          {skill.description ? (
            <p className="mt-1 text-sm text-slate-400">{skill.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Updated: {skill.updatedAt}
          </p>
        </div>
        {skill.is_public ? (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
            {skill.is_public ? "Public" : "Private"}
          </span>
        ) : null}
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

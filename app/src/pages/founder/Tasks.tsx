/**
 * «مهامي» — ما لا يقدر عليه غير المالك، بخطواتٍ قصيرة وعلامة «تمّ».
 *
 * القائمة في `lib/ownerTasks.ts`، والمنجز في `site_settings.founder_todo`
 * (يُرى على كل جهاز). الحفظ متفائل ويرجع إن فشل.
 */
import { useEffect, useState } from "react";
import { Card, ErrorNote, Skeleton, useToast } from "@/components/ui";
import { getSiteSettings, setSiteSetting } from "@/lib/founder";
import {
  OWNER_TASKS,
  TASK_GROUPS,
  TODO_SETTING_KEY,
  parseTodoState,
  remainingCount,
  toggleTask,
  type OwnerTask,
  type TodoState,
} from "@/lib/ownerTasks";
import { Icon } from "@/lib/icons";
import { cn, formatDate } from "@/lib/utils";

export default function Tasks() {
  const toast = useToast();
  const [state, setState] = useState<TodoState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSiteSettings()
      .then((rows) => setState(parseTodoState(rows.find((r) => r.key === TODO_SETTING_KEY)?.value)))
      .catch(() => setError("تعذّر تحميل مهامك."));
  }, []);

  async function toggle(id: string) {
    if (!state) return;
    const prev = state;
    const next = toggleTask(state, id);
    setState(next);
    try {
      await setSiteSetting(TODO_SETTING_KEY, next);
    } catch {
      setState(prev);
      toast("ما انحفظ — جرّب مرة ثانية.", "err");
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (state === null) return <Skeleton className="h-64" />;

  const left = remainingCount(state);
  const done = OWNER_TASKS.length - left;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">مهامي</h1>
      <p className="mt-1 text-sm text-dim">أشياء ما يقدر يسوّيها أحد غيرك. اضغط الدائرة لما تخلّص.</p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-good transition-[width]"
            style={{ width: `${(done / OWNER_TASKS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-dim">
          {done} من {OWNER_TASKS.length}
        </span>
      </div>

      {TASK_GROUPS.map((g) => {
        const tasks = OWNER_TASKS.filter((t) => t.group === g.id);
        return (
          <section key={g.id} className="mt-8">
            <h2 className="font-display text-lg font-extrabold text-ink">{g.label}</h2>
            <p className="text-xs text-faint">{g.hint}</p>
            <div className="mt-3 flex flex-col gap-2">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} doneAt={state[t.id]} onToggle={() => toggle(t.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ task, doneAt, onToggle }: { task: OwnerTask; doneAt?: string; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const done = !!doneAt;

  return (
    <Card className={cn("p-0", done && "opacity-70")}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? `إلغاء «تمّ» عن ${task.title}` : `علّم ${task.title} تمّ`}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-good bg-good text-white" : "border-line hover:border-good"
          )}
        >
          {done && <Icon name="check" size={15} />}
        </button>
        <button className="min-w-0 flex-1 text-start" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <p className={cn("font-bold text-ink", done && "line-through")}>{task.title}</p>
          <p className="mt-0.5 text-xs text-dim">
            {done ? `تمّ ${formatDate(doneAt)}` : task.why}
          </p>
        </button>
        <Icon
          name="chevron"
          size={16}
          className={cn("mt-1 shrink-0 text-faint transition-transform", open ? "-rotate-90" : "rtl:rotate-180")}
        />
      </div>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <ol className="list-decimal space-y-1.5 ps-5 text-sm text-ink">
            {task.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {task.link && (
            <a
              href={task.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-gold hover:underline"
            >
              <Icon name="external" size={13} /> {task.link.label}
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

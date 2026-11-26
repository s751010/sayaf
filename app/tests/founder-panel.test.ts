/**
 * لوحة المؤسّس الجديدة: البوّابة (`lib/founderGate.ts`) و«ينتظرك»
 * (`lib/founderToday.ts`) و«مهامي» (`lib/ownerTasks.ts`) — دوالّ خالصة.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  classifyLoginError,
  founderEmailSql,
  isSqlSafeEmail,
  SQL_EDITOR_URL,
} from "../src/lib/founderGate";
import { buildQueue, greeting } from "../src/lib/founderToday";
import {
  OWNER_TASKS,
  TASK_GROUPS,
  parseTodoState,
  remainingCount,
  toggleTask,
} from "../src/lib/ownerTasks";
import type { FounderOverview } from "../src/lib/founder";

describe("البوّابة", () => {
  it("تصنّف فشل الدخول بلا تخمين", () => {
    expect(classifyLoginError(new TypeError("Failed to fetch"))).toBe("unreachable");
    expect(classifyLoginError(new Error("Email not confirmed"))).toBe("unconfirmed");
    expect(classifyLoginError(new Error("Invalid login credentials"))).toBe("wrong");
  });

  it("سطور SQL بالإيميل نفسه، مؤكِّدةً إيّاه، وتعيد الحجب", () => {
    const sql = founderEmailSql("  Owner@Example.com ")!;
    expect(sql).toContain("'owner@example.com'");
    expect(sql).toContain("email_confirmed_at = coalesce(email_confirmed_at, now())");
    expect(sql).toContain("create or replace function public.founder_email() returns text");
    expect(sql).toContain("revoke all on function public.founder_email() from public, anon, authenticated;");
  });

  it("لا SQL لإيميلٍ يكسر النصّ", () => {
    for (const bad of ["a'b@x.com", "a@x.com; drop table x", "a b@x.com", "no-at", "a@x.com'--"]) {
      expect(isSqlSafeEmail(bad)).toBe(false);
      expect(founderEmailSql(bad)).toBeNull();
    }
  });

  it("رابط محرّر SQL على مشروع كلاود منيو", () => {
    expect(SQL_EDITOR_URL).toBe("https://supabase.com/dashboard/project/wxrukupcyfypnqnotmxv/sql/new");
  });

  it("البوّابة لا تمرّ بدالّة الحافة founder-admin", () => {
    const shell = readFileSync(new URL("../src/pages/founder/Founder.tsx", import.meta.url), "utf8");
    expect(shell).not.toMatch(/founderAdmin\s*[<(]/);
    expect(shell).toContain("checkFounder");
  });
});

const overview = (o: Partial<FounderOverview> = {}): FounderOverview => ({
  revenue_total: 0,
  revenue_30d: 0,
  restaurants_total: 0,
  restaurants_new_7d: 0,
  restaurants_no_dish: 0,
  menus_total: 0,
  dishes_total: 0,
  users_total: 0,
  subs_active: 0,
  subs_trial: 0,
  subs_paid: 0,
  subs_expiring_7d: 0,
  views_30d: 0,
  views_7d: 0,
  tickets_open: 0,
  tickets_unread: 0,
  ...o,
});

describe("ينتظرك", () => {
  const now = Date.parse("2026-11-26T12:00:00Z");

  it("فارغة حين لا شيء", () => {
    expect(buildQueue({ overview: overview(), health: [], errors: [], tasksLeft: 0, now })).toEqual([]);
  });

  it("الخطير أوّلاً، والمهامّ آخراً، والأصفار تختفي", () => {
    const q = buildQueue({
      overview: overview({ tickets_unread: 2, subs_expiring_7d: 1 }),
      health: [
        { kind: "x", severity: "high", title: "", detail: "", restaurant_id: null, restaurant_name: null },
        { kind: "y", severity: "low", title: "", detail: "", restaurant_id: null, restaurant_name: null },
      ],
      errors: [
        { signature: "a", message: "", page: null, stack_head: null, hits: 3, last_seen: "2026-11-26T08:00:00Z" },
        { signature: "b", message: "", page: null, stack_head: null, hits: 1, last_seen: "2026-11-20T08:00:00Z" },
      ],
      tasksLeft: 5,
      now,
    });
    expect(q.map((i) => i.id)).toEqual(["tickets", "health", "expiring", "errors", "tasks"]);
    expect(q.find((i) => i.id === "health")!.n).toBe(1);
    expect(q.find((i) => i.id === "errors")!.n).toBe(1);
    expect(q.every((i) => i.to.startsWith("/founder"))).toBe(true);
  });

  it("ما لم يُحمَّل لا يظهر بنداً", () => {
    expect(buildQueue({ overview: null, health: null, errors: null, tasksLeft: null, now })).toEqual([]);
  });

  it("التحية بساعة الرياض", () => {
    expect(greeting(new Date("2026-11-26T05:00:00Z"))).toBe("صباح الخير"); // ٨ص الرياض
    expect(greeting(new Date("2026-11-26T15:00:00Z"))).toBe("مساء الخير"); // ٦م الرياض
  });
});

describe("مهامي", () => {
  it("المعرّفات فريدة وكل بندٍ في مجموعة معروفة وله خطوة", () => {
    const ids = OWNER_TASKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(TASK_GROUPS.map((g) => g.id));
    for (const t of OWNER_TASKS) {
      expect(groups.has(t.group)).toBe(true);
      expect(t.steps.length).toBeGreaterThan(0);
      if (t.link) expect(t.link.href).toMatch(/^https:\/\//);
    }
  });

  it("القراءة متسامحة: شكلٌ غريب أو معرّفٌ مجهول = لا شيء", () => {
    expect(parseTodoState(null)).toEqual({});
    expect(parseTodoState([1, 2])).toEqual({});
    expect(parseTodoState({ domain: "2026-11-01", ghost: "2026-11-01", uptime: 5 })).toEqual({ domain: "2026-11-01" });
  });

  it("التبديل لا يعدّل الأصل، والعدّ يتبعه", () => {
    const a = {};
    const b = toggleTask(a, "domain", new Date("2026-11-26T00:00:00Z"));
    expect(a).toEqual({});
    expect(b).toEqual({ domain: "2026-11-26T00:00:00.000Z" });
    expect(remainingCount(b)).toBe(OWNER_TASKS.length - 1);
    expect(toggleTask(b, "domain")).toEqual({});
  });
});

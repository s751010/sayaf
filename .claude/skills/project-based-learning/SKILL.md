---
name: project-based-learning
description: "Curated index of ~460 free, project-based programming tutorials (build an app, a tool, or a technology from scratch) across 22 languages, vendored verbatim from practical-tutorials/project-based-learning (MIT). Use when the user wants to learn by building, asks for a tutorial or a practice project in a language or stack (React, Node, Python, Go, Rust, C, Swift…), wants to understand a technology by re-implementing it (interpreter, Redux, virtual DOM, git, database, shell), or writes «علّمني» / «أبي أتعلّم» / «مشروع تطبيقي» / «دروس» / «كيف أبني». Also the source of truth for the list's quality bar and its validator."
---

# Project-Based Learning

A list of tutorials where the reader **builds a complete, working thing**, grouped by
primary language. The full list lives in `references/README.md`, copied verbatim from
upstream and pinned in `upstream.json`. Never edit the vendored files here: fix
upstream, then re-vendor (see "Updating" below). `scripts/selftest.py` fails on any
local edit.

| Path | What it is |
|---|---|
| `references/README.md` | The full list: 457 entries, 23 sections |
| `references/CONTRIBUTING.md` | Upstream's quality bar for an entry |
| `scripts/check_readme.py` | Upstream's validator (stdlib Python): `lint`, `check-links` |
| `scripts/selftest.py` | This skill's own test: pin, lint, and every link cited below |
| `upstream.json` | Upstream commit, date, and SHA-256 of each vendored file |
| `LICENSE.md` | Upstream MIT license (keep it with the copy) |

## How to answer a learning request

1. **Pin down the stack and the level.** Language, framework, and what they want to
   end up with (a web app, a CLI, "how does X work inside").
2. **Find the section.** List the headings with line numbers, then read only that range:
   ```bash
   grep -n '^#\{2,4\} ' .claude/skills/project-based-learning/references/README.md
   ```
   Headings go three levels deep: `## Python:` → `### Web Applications:` → `#### React:`.
   A multi-part series is a plain bullet with nested `- [Part N](…)` links under it.
3. **Pick one to three entries, not ten.** Prefer `https://`, a recent framework
   version, and a finished artifact the user actually wants. Many entries are old
   (Angular 1.x, React class components, 2016 Webpack); say so when you suggest one.
4. **Say what they will build and why it fits**, then link it. Links can rot: upstream
   sweeps them weekly, but this copy is a snapshot. If a link fails, say so and offer
   the next pick instead of guessing a new URL.
5. **Never invent entries.** Every link you give must appear in `references/README.md`.

## For this repository (CloudMenu)

Picks that teach what this codebase actually does, so a session can explain the
"why" behind a rule in `CLAUDE.md`:

| Topic in CloudMenu | Tutorial from the list | Section |
|---|---|---|
| Hook order and rendering (the `React #310` outage, §6 of `CLAUDE.md`) | [How to write your own Virtual DOM](https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060) | `### Miscellaneous:` (JavaScript) |
| State without a library (CloudMenu uses React context, no Redux) | [Build Yourself a Redux](https://zapier.com/engineering/how-to-build-redux/) | `### Miscellaneous:` (JavaScript) |
| Browser tests (`app/e2e/`, Playwright) | [Testing React App With Puppeteer and Jest](https://blog.bitsrc.io/testing-your-react-app-with-puppeteer-and-jest-c72b3dfcde59) | `#### React:` |
| Service worker and offline menu (`main.tsx`, `public/sw.js`) | [PWA Part 1: offline-first with a service worker](https://bitsofco.de/bitsofcode-pwa-part-1-offline-first-with-service-worker/) and [Part 2: IndexedDB](https://bitsofco.de/bitsofcode-pwa-part-2-instant-loading-with-indexeddb/) | `#### Others (Hapi, Express...):` |
| Postgres with tests first (Supabase is Postgres) | [Test-Driven Development with Node, Postgres and Knex](http://mherman.org/blog/2016/04/28/test-driven-development-with-node/) | `#### Node:` |
| Hand-drawn charts (`dashboard/Analytics.tsx`) | [Learn To Make A Line Chart](https://medium.freecodecamp.org/learn-to-create-a-line-chart-using-d3-js-4f43f1ee716b) | `#### D3.js` |
| The Next.js line that was archived (`archive/web-nextjs-line`) | [App Router](https://nextjs.org/learn/dashboard-app) | `#### Next.js:` |

These are for learning only. They do not override `CLAUDE.md`: no SDK, no `select=*`,
whitelisted writes, and the §18 theme fingerprint still hold.

## Quality bar for an entry (from upstream `CONTRIBUTING.md`)

- Free and open: no paywall, login wall, or required newsletter signup.
- Project-based: the reader ends with a complete, working artifact, not a concept essay.
- Points straight at the tutorial: no URL shorteners.
- Format `- [Title](https://…)`, or a plain title bullet with nested `- [Part N](…)`.

## Testing and validation

```bash
# Everything this skill guarantees (CI runs this on every push):
python3 .claude/skills/project-based-learning/scripts/selftest.py

# Upstream's grammar/TOC/duplicate lint on the vendored list:
cd .claude/skills/project-based-learning && python3 scripts/check_readme.py lint \
  --readme references/README.md --allow-duplicates scripts/lint-allow-duplicates.txt

# Optional, slow, needs open network: liveness of every link (no state is written):
cd .claude/skills/project-based-learning && python3 scripts/check_readme.py check-links --all \
  --readme references/README.md --domain-policy scripts/linkcheck-domains.txt --dry-run
```

`check_readme.py` treats README content as untrusted data and never shells out with
it. Keep it that way if you ever touch it upstream.

## Updating

1. `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/practical-tutorials/project-based-learning /tmp/pbl`
2. Copy `README.md` and `CONTRIBUTING.md` into `references/`, `LICENSE.md` to the
   skill root, and the three files under `scripts/` except `selftest.py`.
3. Update `commit`, `commit_date`, every SHA-256, and `lint_stats` in `upstream.json`.
4. Run `scripts/selftest.py`. If a link in the CloudMenu table above was removed
   upstream, replace that row with another entry from the list.

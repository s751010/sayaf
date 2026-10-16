#!/usr/bin/env python3
"""Self-test for the project-based-learning skill. Stdlib only; exits 1 on any failure.

What it guarantees, in order:
  1. SKILL.md has valid frontmatter: `name` equals the folder name, and a
     `description` within Claude's 1024-character limit.
  2. Every vendored upstream file still matches the SHA-256 pinned in
     upstream.json, so nobody edited the copy by hand.
  3. Upstream's own validator lints the vendored list with zero errors and zero
     warnings, and the entry/URL/section counts match the pin.
  4. Every tutorial URL that SKILL.md cites appears in the list, and every
     backticked heading it names (`#### React:`) exists. A recommendation that
     points outside the list is a broken promise.

Run from anywhere:  python3 .claude/skills/project-based-learning/scripts/selftest.py
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
README = SKILL_DIR / "references" / "README.md"
UPSTREAM_REPO = "https://github.com/practical-tutorials/project-based-learning"
DESCRIPTION_LIMIT = 1024

failures = []


def check(ok, message):
    print(("  ok    " if ok else "  FAIL  ") + message)
    if not ok:
        failures.append(message)


def frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        return None
    fields = {}
    for line in match.group(1).splitlines():
        key, sep, value = line.partition(":")
        if sep:
            fields[key.strip()] = value.strip().strip('"')
    return fields


def test_frontmatter(skill_text):
    print("1. SKILL.md frontmatter")
    fields = frontmatter(skill_text)
    check(fields is not None, "frontmatter block present")
    if fields is None:
        return
    check(fields.get("name") == SKILL_DIR.name, f"name == folder ({SKILL_DIR.name})")
    description = fields.get("description", "")
    check(bool(description), "description present")
    check(len(description) <= DESCRIPTION_LIMIT, f"description <= {DESCRIPTION_LIMIT} chars ({len(description)})")


def test_pin(pin):
    print("2. Vendored files match upstream.json")
    check(pin.get("repo") == UPSTREAM_REPO, "pinned repo is upstream")
    check(re.fullmatch(r"[0-9a-f]{40}", pin.get("commit", "")) is not None, "pinned commit is a full SHA")
    for rel, expected in sorted(pin.get("files", {}).items()):
        path = SKILL_DIR / rel
        actual = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "missing"
        check(actual == expected, f"{rel} unchanged")


def test_lint(pin):
    print("3. Upstream lint on the vendored list")
    result = subprocess.run(
        [
            sys.executable, "-I", str(SKILL_DIR / "scripts" / "check_readme.py"), "lint", "--json",
            "--readme", str(README),
            "--allow-duplicates", str(SKILL_DIR / "scripts" / "lint-allow-duplicates.txt"),
        ],
        capture_output=True, text=True, check=False,
    )
    check(result.returncode == 0, f"check_readme.py lint exits 0 (got {result.returncode})")
    try:
        stats = json.loads(result.stdout)["stats"]
    except (ValueError, KeyError):
        check(False, "lint --json output parses")
        return
    check(stats["errors"] == 0, f"0 errors ({stats['errors']})")
    check(stats["warnings"] == 0, f"0 warnings ({stats['warnings']})")
    for key, expected in pin.get("lint_stats", {}).items():
        check(stats.get(key) == expected, f"{key} == {expected} ({stats.get(key)})")


def test_citations(skill_text, readme_text):
    print("4. Everything SKILL.md cites exists in the list")
    readme_lines = {line.rstrip() for line in readme_text.splitlines()}
    # A host with a dot is required, so format examples like `[Title](https://…)` don't count.
    url_re = r"\]\((https?://[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:/[^)\s]*)?)\)"
    urls = [u for u in re.findall(url_re, skill_text) if not u.startswith(UPSTREAM_REPO)]
    check(len(urls) >= 5, f"SKILL.md cites tutorials ({len(urls)})")
    for url in urls:
        check(f"]({url})" in readme_text, f"cited URL listed: {url}")
    headings = re.findall(r"`(#{2,4} [^`]+)`", skill_text)
    check(len(headings) >= 3, f"SKILL.md names sections ({len(headings)})")
    for heading in sorted(set(headings)):
        check(heading in readme_lines, f"heading exists: {heading}")


def main():
    skill_text = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    readme_text = README.read_text(encoding="utf-8")
    pin = json.loads((SKILL_DIR / "upstream.json").read_text(encoding="utf-8"))

    test_frontmatter(skill_text)
    test_pin(pin)
    test_lint(pin)
    test_citations(skill_text, readme_text)

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

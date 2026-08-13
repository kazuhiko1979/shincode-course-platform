#!/usr/bin/env python3
"""Read-only repository-wide SKILL.md metadata and heuristic audit."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

SKILL_DIR_NAMES = {".agents", ".claude", ".codex"}
SUSPICIOUS = [
    ("secret-exfiltration", r"(?i)(send|upload|post|exfiltrat).{0,80}(secret|token|password|credential|api[_ -]?key)"),
    ("safeguard-bypass", r"(?i)(ignore|disable|bypass|circumvent).{0,60}(security|safety|approval|permission|instruction|policy)"),
    ("destructive-command", r"(?i)\b(rm\s+-rf|git\s+reset\s+--hard|git\s+checkout\s+--|drop\s+database)\b"),
    ("shell-download-exec", r"(?i)(curl|wget).{0,120}(\||sh\b|bash\b)"),
]


def discover(root: Path) -> list[Path]:
    found: list[Path] = []
    for current, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in {".git", "node_modules", ".next", "dist", "build"})
        if "SKILL.md" in files:
            path = Path(current) / "SKILL.md"
            if any(part in SKILL_DIR_NAMES for part in path.relative_to(root).parts):
                found.append(path)
        # os.walk does not enter symlinked directories. Include a direct
        # SKILL.md target so mirrored .claude/.agents layouts are visible,
        # while avoiding recursive symlink cycles.
        for directory in dirs:
            candidate = Path(current) / directory / "SKILL.md"
            if (Path(current) / directory).is_symlink() and candidate.is_file():
                if any(part in SKILL_DIR_NAMES for part in candidate.relative_to(root).parts):
                    found.append(candidate)
    return sorted(found)


def frontmatter(text: str) -> tuple[dict[str, str], str | None]:
    if not text.startswith("---\n"):
        return {}, "missing frontmatter"
    end = text.find("\n---", 4)
    if end == -1:
        return {}, "unterminated frontmatter"
    values: dict[str, str] = {}
    current_key: str | None = None
    for line in text[4:end].splitlines():
        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if match:
            current_key = match.group(1)
            values[current_key] = match.group(2).strip().strip("'\"")
        elif current_key and line[:1].isspace() and line.strip():
            values[current_key] += " " + line.strip()
    return values, None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--external", action="store_true", help="also run npx skill-check with verbose security output")
    args = parser.parse_args()
    root = Path(args.root).resolve()
    files = discover(root)
    names: dict[str, list[Path]] = defaultdict(list)
    descriptions: dict[str, list[Path]] = defaultdict(list)
    errors: list[str] = []
    warnings: list[str] = []
    candidates: list[str] = []

    print(f"Skill audit root: {root}")
    print(f"Skills discovered: {len(files)}")
    for path in files:
        rel = path.relative_to(root)
        text = path.read_text(encoding="utf-8", errors="replace")
        data, parse_error = frontmatter(text)
        if parse_error:
            errors.append(f"{rel}: {parse_error}")
        for key in ("name", "description"):
            if not data.get(key):
                errors.append(f"{rel}: missing frontmatter field '{key}'")
        if data.get("name"):
            names[data["name"]].append(rel)
        if data.get("description"):
            descriptions[data["description"]].append(rel)
        for label, pattern in SUSPICIOUS:
            if re.search(pattern, text):
                candidates.append(f"{rel}: {label}")

    for name, paths in sorted(names.items()):
        if len(paths) > 1:
            warnings.append(f"duplicate name '{name}': {', '.join(map(str, paths))}")
    for description, paths in descriptions.items():
        if len(paths) > 1:
            warnings.append(f"identical description ({len(paths)} copies): {', '.join(map(str, paths))}")

    print(f"Validation errors: {len(errors)}")
    print(f"Duplicate warnings: {len(warnings)}")
    print(f"Heuristic security candidates: {len(candidates)}")
    for item in errors + warnings + candidates:
        print(f"  - {item}")

    if args.external:
        print("External scanner: running npx skill-check . --security-scan-verbose")
        result = subprocess.run(["npx", "skill-check", ".", "--security-scan-verbose"], cwd=root, text=True, capture_output=True)
        print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, file=sys.stderr, end="")
        print(f"External scanner exit code: {result.returncode}")

    return 1 if errors or candidates else 0


if __name__ == "__main__":
    raise SystemExit(main())

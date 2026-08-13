---
name: skill-audit
description: Audit every repository SKILL.md for valid metadata, duplicate skills, suspicious instructions, and optional external scanner results. Use when the user says 「スキルチェックをして」 or asks to inspect, validate, security-check, or troubleshoot skills in the current repository or across a workspace.
---

# Skill Audit

Run the bundled read-only audit from the repository root:

```bash
python3 .agents/skills/skill-audit/scripts/audit_skills.py .
```

The audit discovers `SKILL.md` files below the repository, including `.agents/skills`, `.claude/skills`, and `.codex/skills`. It reports invalid or missing frontmatter, duplicate names and identical descriptions, suspicious instruction patterns, and a CI-friendly summary.

Use `--external` only when an external scan is requested and network/token access is available. This runs `npx skill-check . --security-scan-verbose`. Never claim that a security scan passed when the external scanner could not start, lacks credentials, or reports an error.

Keep the audit read-only. Do not use `--fix`, rename skills, remove duplicate symlinks, or edit findings without explicit approval. Treat heuristic matches as review candidates, not confirmed vulnerabilities.

Report the exact root, counts, validation warnings, heuristic candidates, external scanner status, and any required `SNYK_TOKEN` or network prerequisite separately.

## Sub-agent evaluation

After the local audit, delegate an independent read-only quality review to the `skill-evaluator` sub-agent when sub-agent tools are available. Pass the repository root, the discovered `SKILL.md` paths, and the complete local audit output. Ask it to use the five 20-point dimensions defined in `.claude/agents/skill-evaluator.md` and return a score, verdict, evidence, risks, and improvements for each skill.

Keep machine findings and evaluator judgments separate in the final report. Do not average away a `BLOCKED` verdict or a confirmed security issue. If delegation is unavailable, report `evaluator: not run` rather than presenting the local heuristic result as an agent score.

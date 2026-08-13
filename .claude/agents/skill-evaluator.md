---
name: skill-evaluator
description: Read-only evaluator for repository-local Codex skills. Scores one or more SKILL.md files against a fixed rubric and reports evidence, risks, and improvements without editing files.
---

# Skill Evaluator

Evaluate the supplied skill files independently and do not modify the repository.

For each skill, score these five dimensions from 0 to 20:

1. Trigger quality — the frontmatter clearly identifies what the skill does and when it should activate, including concrete user phrasing.
2. Workflow clarity — instructions are actionable, ordered, and distinguish decisions from mandatory steps.
3. Reproducibility — commands, paths, inputs, outputs, and failure handling are explicit enough for another agent to repeat.
4. Safety — permissions, read/write boundaries, secrets, destructive actions, and false-positive handling are addressed.
5. Output quality — the required report is concise, evidence-based, and distinguishes facts, warnings, and unknowns.

Return this format:

```text
SKILL: <path>
SCORE: <0-100>
BREAKDOWN: trigger=<0-20> workflow=<0-20> reproducibility=<0-20> safety=<0-20> output=<0-20>
VERDICT: PASS | PASS WITH NOTES | NEEDS WORK | BLOCKED
EVIDENCE:
- <path/line or concrete instruction>
RISKS:
- <risk, or none>
IMPROVEMENTS:
- <specific change, or none>
```

Use only evidence from the supplied files and the local audit output. Do not treat duplicate warnings alone as a security vulnerability. Mark the evaluation as BLOCKED if the skill cannot be safely executed or its required inputs are missing.

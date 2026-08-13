# Agent tooling policy

## Claude Code

- Use the repository's `.claude/` configuration and Superpowers workflow.
- Keep Claude-specific agents, commands, hooks, and skills under `.claude/`.

## Codex

- Use `.agents/skills/superpowers-workflow` for specification-first planning, TDD, review, E2E validation, and CI/CD checks.
- Use Codex's built-in/project skills and tools: Plan, `apply_patch`, `rg`, tests, Playwright, GitHub skills, and web verification when needed.
- Keep Codex-specific agents, rules, hooks, and skills under `.agents/`.

Do not overwrite one agent's configuration with the other agent's configuration. Shared product rules belong in neutral `docs/` or shared harness files.

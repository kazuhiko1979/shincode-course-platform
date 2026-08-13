# Test conventions

- Unit tests live under `test/` and use Node's built-in `node:test` runner.
- Prefer pure logic tests for auth, redirect, and schema validation.
- Keep tests deterministic and avoid network access.
- When adding a new domain, create a sibling test file such as `test/auth/foo.test.ts`.

# Pacific Watch

**The project documentation lives in [`AGENTS.md`](AGENTS.md). Read that file.**

This repo is worked on by two agents — Claude Code and ChatGPT Codex — so the architecture notes,
data sources, security rules, theming constraints, and the working agreement that governs branching
and PRs are all kept in one shared file that both agents read. `CLAUDE.md` exists only so Claude
Code picks up the pointer automatically.

Two things worth knowing before you touch anything:

- **`main` is protected and a merge to `main` is a production deploy.** Work on a `claude/<topic>`
  branch and open a PR. Check the Vercel preview before asking for a merge.
- **`AGENTS.md` has a "Load-bearing decisions — do NOT 'fix' these" table.** Several things in this
  codebase look like bugs and are deliberate security or accessibility choices. Read it first.

If you learn something durable about this project, record it in `AGENTS.md`, not here — this file
is a pointer, and a second copy of the docs would immediately drift.

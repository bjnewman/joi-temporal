# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Joi extension library (`@bjnewman/joi-temporal`) that validates and coerces [Temporal API](https://tc39.es/proposal-temporal/docs/) types. It exports an array of Joi extension factories — one per Temporal type — spread into `Joi.extend(...joiTemporal)`.

Requires `globalThis.Temporal` at runtime (native or polyfill). Peer dependency on `joi >= 17`.

## Commands

```bash
bun install --frozen-lockfile     # Install deps
bun run test                      # Run all tests (c8 + node:test with temporal-polyfill)
bun run lint                      # oxlint
bun run type:check                # tsc --noEmit
bun run build                     # tsc → dist/
```

Run a single test file:
```bash
c8 node --import temporal-polyfill/global --import tsx --test test/plainDate.test.ts
```

Tests use `node:test` and `node:assert/strict`. The `temporal-polyfill/global` import provides Temporal. Test helpers (`test/helpers.ts`) export `custom` (Joi extended with all temporal types), `expectPass`, and `expectError`.

## Architecture

**Single source file:** `src/index.ts` contains everything — the Temporal availability check, the `makeExtension` factory, and all 8 type configs.

`makeExtension(config: TypeConfig)` is the core abstraction. It takes a config object (type name, check function, parser, comparator, messages) and returns a Joi extension factory with coercion, validation, and comparison rules (`min`/`max`/`gt`/`lt`/`gte`/`lte`). Types without a `compare` function (like `plainMonthDay`) get no comparison rules. Types with `extraRules` (like `duration.positive()` and `zonedDateTime.timezone()`) are merged in.

The default export is an array of 8 extension factories: `plainDate`, `plainTime`, `plainDateTime`, `zonedDateTime`, `instant`, `duration`, `plainYearMonth`, `plainMonthDay`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): lint → type:check → test on push/PR to main
- **Release** (`.github/workflows/release.yml`): build → test → semantic-release on push to main. Uses conventional commits to determine version bumps. Config in `.releaserc.yml`.

## Git Practices

- **Single-line commit messages under 80 characters.** Always. No exceptions.
- **Never use destructive git commands** — no `push --force`, `reset --hard`, `checkout .`, `clean -f`, `branch -D`, etc.
- **Commit frequently** — check work into version control often. Squash commits later before merging.

## Spec

`SPEC.md` contains the full specification with design decisions, coercion tables, test plan, and prior art references. Consult it when adding new types or rules.

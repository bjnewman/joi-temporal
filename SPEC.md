# joi-temporal Specification

Joi extension for validating and coercing [Temporal API](https://tc39.es/proposal-temporal/docs/) types.

## Motivation

Joi has date extensions (`@joi/date`, `@reis/joi-luxon`, `joi-date-dayjs`) for legacy date libraries but nothing for the Temporal API. `zod-temporal` exists but many backend Node.js codebases use Joi. This library fills that gap.

## Design Principles

1. **Zero runtime dependencies** — no polyfill bundled. Checks `globalThis.Temporal` at import time and throws a clear error if missing. Users provide Temporal via native support (`--harmony-temporal`, Chrome 144+, Firefox 139+) or their polyfill of choice (`temporal-polyfill`, `@js-temporal/polyfill`).

2. **Peer dependency on Joi >= 17** — uses the `Joi.extend()` API introduced in v17.

3. **Coerce from ISO strings** — JSON payloads contain strings. The coerce step parses ISO strings into Temporal objects via `Temporal.*.from()`. If the value is already a Temporal instance, coercion is skipped.

4. **Follow Joi conventions** — the extension should feel native. Same error structure, same chaining patterns, same `.describe()` output as built-in types.

5. **Minimal API surface** — only add rules that make sense per type. No speculative features.

---

## Temporal Availability Check

On import, the module checks:

```ts
if (typeof globalThis.Temporal === "undefined") {
  throw new Error(
    "joi-temporal requires the Temporal API. " +
    "Use a supported runtime (Node 22+ with --harmony-temporal, Chrome 144+, Firefox 139+) " +
    "or install a polyfill (temporal-polyfill, @js-temporal/polyfill)."
  );
}
```

This runs once at module load. No runtime branching after that.

---

## API

### Usage

```ts
import Joi from "joi";
import joiTemporal from "joi-temporal";

const custom = Joi.extend(...joiTemporal);

// Now available:
custom.plainDate()
custom.plainTime()
custom.plainDateTime()
custom.zonedDateTime()
custom.duration()
custom.instant()
custom.plainYearMonth()
custom.plainMonthDay()
```

The default export is an **array of Joi extension factories** (one per type), spread into `Joi.extend()`.

---

## Supported Types

### 1. `plainDate()`

Validates and coerces to `Temporal.PlainDate`.

**Coercion:** ISO 8601 date string → `Temporal.PlainDate.from(value)`

| Input | Result |
|-------|--------|
| `"2021-01-15"` | `Temporal.PlainDate { year: 2021, month: 1, day: 15 }` |
| `"2021-02-31"` | Error: invalid date (overflow) |
| `"foo"` | Error: invalid plain date |
| `42` | Error: must be a string or PlainDate |
| `Temporal.PlainDate.from("2021-01-15")` | Passthrough (no coercion) |

**Rules:**

| Rule | Description | Example |
|------|-------------|---------|
| `.min(date)` | Value must be on or after `date` | `.min("2020-01-01")` |
| `.max(date)` | Value must be on or before `date` | `.max("2025-12-31")` |
| `.gt(date)` | Value must be strictly after `date` | `.gt("2020-01-01")` |
| `.lt(date)` | Value must be strictly before `date` | `.lt("2025-12-31")` |
| `.gte(date)` | Alias for `.min()` | |
| `.lte(date)` | Alias for `.max()` | |

Comparison arguments accept ISO strings or `Temporal.PlainDate` instances. They are parsed via `Temporal.PlainDate.from()` at validation time.

Special value `"now"` is accepted as a comparator — resolved to `Temporal.Now.plainDateISO()` at validation time (not at schema construction time).

---

### 2. `plainTime()`

Validates and coerces to `Temporal.PlainTime`.

**Coercion:** ISO 8601 time string → `Temporal.PlainTime.from(value)`

| Input | Result |
|-------|--------|
| `"14:30:00"` | `Temporal.PlainTime { hour: 14, minute: 30, second: 0 }` |
| `"14:30"` | `Temporal.PlainTime { hour: 14, minute: 30, second: 0 }` |
| `"25:00:00"` | Error: invalid time |
| `"foo"` | Error: invalid plain time |

**Rules:** `.min()`, `.max()`, `.gt()`, `.lt()`, `.gte()`, `.lte()` — compare via `Temporal.PlainTime.compare()`.

---

### 3. `plainDateTime()`

Validates and coerces to `Temporal.PlainDateTime`.

**Coercion:** ISO 8601 datetime string (no timezone) → `Temporal.PlainDateTime.from(value)`

| Input | Result |
|-------|--------|
| `"2021-01-15T14:30:00"` | `Temporal.PlainDateTime { ... }` |
| `"2021-01-15T14:30"` | `Temporal.PlainDateTime { ... }` |
| `"2021-01-15"` | `Temporal.PlainDateTime { hour: 0, minute: 0, ... }` |
| `"foo"` | Error: invalid plain date time |

**Rules:** `.min()`, `.max()`, `.gt()`, `.lt()`, `.gte()`, `.lte()` — compare via `Temporal.PlainDateTime.compare()`.

---

### 4. `zonedDateTime()`

Validates and coerces to `Temporal.ZonedDateTime`.

**Coercion:** ISO 8601 string with timezone annotation → `Temporal.ZonedDateTime.from(value)`

| Input | Result |
|-------|--------|
| `"2021-01-15T14:30:00+01:00[Europe/Berlin]"` | `Temporal.ZonedDateTime { ... }` |
| `"2021-01-15T14:30:00Z"` | Error: missing timezone annotation |
| `"foo"` | Error: invalid zoned date time |

**Rules:**

| Rule | Description |
|------|-------------|
| `.min(date)` | Value must be on or after `date` (compared as instants) |
| `.max(date)` | Value must be on or before `date` (compared as instants) |
| `.gt(date)` | Strictly after |
| `.lt(date)` | Strictly before |
| `.gte(date)` | Alias for `.min()` |
| `.lte(date)` | Alias for `.max()` |
| `.timezone(tz)` | Require a specific timezone, e.g. `.timezone("America/New_York")` |

Comparisons use `Temporal.ZonedDateTime.compare()` which compares exact instants (not wall-clock time). Comparator arguments accept ISO strings or `Temporal.ZonedDateTime` instances.

---

### 5. `instant()`

Validates and coerces to `Temporal.Instant`.

**Coercion:** ISO 8601 string with offset → `Temporal.Instant.from(value)`

| Input | Result |
|-------|--------|
| `"2021-01-15T14:30:00Z"` | `Temporal.Instant { ... }` |
| `"2021-01-15T14:30:00+05:30"` | `Temporal.Instant { ... }` |
| `"2021-01-15T14:30:00"` | Error: missing offset |
| `"foo"` | Error: invalid instant |

**Rules:** `.min()`, `.max()`, `.gt()`, `.lt()`, `.gte()`, `.lte()` — compare via `Temporal.Instant.compare()`.

---

### 6. `duration()`

Validates and coerces to `Temporal.Duration`.

**Coercion:** ISO 8601 duration string → `Temporal.Duration.from(value)`

| Input | Result |
|-------|--------|
| `"PT1H30M"` | `Temporal.Duration { hours: 1, minutes: 30 }` |
| `"P1Y2M3D"` | `Temporal.Duration { years: 1, months: 2, days: 3 }` |
| `"PT0S"` | `Temporal.Duration { }` (zero duration) |
| `"foo"` | Error: invalid duration |

**Rules:**

| Rule | Description | Example |
|------|-------------|---------|
| `.min(dur)` | Total duration must be >= `dur` | `.min("PT1H")` |
| `.max(dur)` | Total duration must be <= `dur` | `.max("P1D")` |
| `.positive()` | Duration sign must be positive | |
| `.negative()` | Duration sign must be negative | |
| `.nonzero()` | Duration must not be zero | |

Duration comparison uses `Temporal.Duration.compare()` with a `relativeTo` of `Temporal.Now.plainDateISO()` when calendar units (years, months) are involved. For time-only durations, no `relativeTo` is needed.

---

### 7. `plainYearMonth()`

Validates and coerces to `Temporal.PlainYearMonth`.

**Coercion:** `"YYYY-MM"` string → `Temporal.PlainYearMonth.from(value)`

| Input | Result |
|-------|--------|
| `"2021-01"` | `Temporal.PlainYearMonth { year: 2021, month: 1 }` |
| `"2021-13"` | Error: invalid year-month |

**Rules:** `.min()`, `.max()`, `.gt()`, `.lt()`, `.gte()`, `.lte()` — compare via `Temporal.PlainYearMonth.compare()`.

---

### 8. `plainMonthDay()`

Validates and coerces to `Temporal.PlainMonthDay`.

**Coercion:** `"MM-DD"` string → `Temporal.PlainMonthDay.from(value)`

| Input | Result |
|-------|--------|
| `"12-30"` | `Temporal.PlainMonthDay { month: 12, day: 30 }` |
| `"02-31"` | Error: invalid month-day |

**Rules:** None. `PlainMonthDay` has no natural total ordering (Feb 29 depends on year context), so comparison rules are omitted.

---

## Error Messages

Each type has a default error message template. All are overridable via Joi's `.messages()` and `.error()`.

| Error Code | Default Message |
|------------|----------------|
| `temporal.plainDate.base` | `"must be a valid ISO 8601 date string or Temporal.PlainDate"` |
| `temporal.plainDate.min` | `"must be on or after {#limit}"` |
| `temporal.plainDate.max` | `"must be on or before {#limit}"` |
| `temporal.plainDate.gt` | `"must be after {#limit}"` |
| `temporal.plainDate.lt` | `"must be before {#limit}"` |
| `temporal.plainTime.base` | `"must be a valid ISO 8601 time string or Temporal.PlainTime"` |
| `temporal.plainDateTime.base` | `"must be a valid ISO 8601 date-time string or Temporal.PlainDateTime"` |
| `temporal.zonedDateTime.base` | `"must be a valid ISO 8601 date-time string with timezone or Temporal.ZonedDateTime"` |
| `temporal.zonedDateTime.timezone` | `"must be in timezone {#timezone}"` |
| `temporal.instant.base` | `"must be a valid ISO 8601 string with offset or Temporal.Instant"` |
| `temporal.duration.base` | `"must be a valid ISO 8601 duration string or Temporal.Duration"` |
| `temporal.duration.min` | `"must be at least {#limit}"` |
| `temporal.duration.max` | `"must be at most {#limit}"` |
| `temporal.duration.positive` | `"must be a positive duration"` |
| `temporal.duration.negative` | `"must be a negative duration"` |
| `temporal.duration.nonzero` | `"must not be zero"` |
| `temporal.plainYearMonth.base` | `"must be a valid ISO 8601 year-month string or Temporal.PlainYearMonth"` |
| `temporal.plainMonthDay.base` | `"must be a valid ISO 8601 month-day string or Temporal.PlainMonthDay"` |

The `{#limit}` token is replaced with the ISO string representation of the comparator at error time.

---

## Extension Structure

Each type is a separate extension factory following Joi's `extend()` contract:

```ts
(joi: Joi.Root) => Joi.Extension
```

Each extension object contains:

```ts
{
  type: "plainDate",           // registers as joi.plainDate()
  base: joi.any(),
  messages: { ... },
  coerce(value, helpers) {
    // string → Temporal.PlainDate.from(value)
    // already PlainDate → passthrough
    // else → error
  },
  validate(value, helpers) {
    // instanceof Temporal.PlainDate check
  },
  rules: {
    min: { method(limit) {}, validate(value, helpers, args) {} },
    max: { ... },
    gt:  { ... },
    lt:  { ... },
    gte: { ... },
    lte: { ... },
  }
}
```

---

## `describe()` Output

Schemas should be introspectable:

```ts
const schema = custom.plainDate().min("2020-01-01").max("2025-12-31");
schema.describe();
// {
//   type: "plainDate",
//   rules: [
//     { name: "min", args: { limit: "2020-01-01" } },
//     { name: "max", args: { limit: "2025-12-31" } }
//   ]
// }
```

---

## Test Plan

Tests use Node.js native test runner (`node:test` + `node:assert/strict`). Temporal is provided via `temporal-polyfill` in test setup so tests run without `--harmony-temporal`.

### Per-type test categories

Each of the 8 types gets a test file with these categories:

#### 1. Coercion (string → Temporal)
- Valid ISO string → correct Temporal instance
- Multiple valid format variations (where applicable)
- Invalid string → error with correct code
- Wrong JS type (number, boolean, object) → error
- Already-correct Temporal instance → passthrough (no coercion)
- `null` / `undefined` behavior (respects `.required()` / `.optional()`)

#### 2. Comparison rules (where applicable)
- `.min(isoString)` — value at boundary → pass
- `.min(isoString)` — value before boundary → error with `{#limit}`
- `.max(isoString)` — value at boundary → pass
- `.max(isoString)` — value after boundary → error
- `.gt(isoString)` — value at boundary → error (strict)
- `.gt(isoString)` — value after boundary → pass
- `.lt(isoString)` — value at boundary → error (strict)
- `.lt(isoString)` — value before boundary → pass
- `.min(temporalInstance)` — accepts Temporal objects as comparators
- `.min("now")` — resolves to current date/time
- Chained rules: `.min().max()` — both enforced

#### 3. Type-specific rules
- `duration().positive()` / `.negative()` / `.nonzero()`
- `zonedDateTime().timezone("America/New_York")`

#### 4. Joi integration
- `.required()` — undefined fails
- `.optional()` — undefined passes
- `.allow(null)` — null passes
- `.valid("2021-01-01")` — allowlist
- `.invalid("2021-01-01")` — blocklist
- `.describe()` — returns correct structure
- `.messages({ ... })` — custom error messages
- Inside `Joi.object({ field: custom.plainDate() })` — works in object schemas
- `.default("2021-01-01")` — default value is coerced
- `convert: false` option — string stays string, Temporal instance passes

#### 5. Edge cases
- Overflow dates: `"2021-02-31"` → error
- Leap year: `"2024-02-29"` → pass, `"2023-02-29"` → error
- Midnight boundary: `"24:00:00"` behavior
- Empty string `""` → error
- Whitespace `" 2021-01-01 "` → error (no trimming)
- Very large years: `"+100000-01-01"` → depends on Temporal spec

### Test file structure

```
test/
  setup.ts              # imports temporal-polyfill/global
  plainDate.test.ts
  plainTime.test.ts
  plainDateTime.test.ts
  zonedDateTime.test.ts
  instant.test.ts
  duration.test.ts
  plainYearMonth.test.ts
  plainMonthDay.test.ts
```

### Estimated test count

~25 tests per comparable type (8 types, but PlainMonthDay has fewer) ≈ **180-200 tests**.

---

## Source File Structure

```
src/
  index.ts              # default export: array of all extensions
  check.ts              # globalThis.Temporal availability check
  types/
    plainDate.ts
    plainTime.ts
    plainDateTime.ts
    zonedDateTime.ts
    instant.ts
    duration.ts
    plainYearMonth.ts
    plainMonthDay.ts
  util.ts               # shared helpers (makeComparatorRules, coercion helpers)
```

---

## Prior Art

| Library | What we borrow |
|---------|---------------|
| [`@joi/date`](https://github.com/hapijs/joi-date) | Extension structure, `format()` pattern, test helpers |
| [`@reis/joi-luxon`](https://github.com/adamreisnz/joi-luxon) | Comparison rules API (`.min()`, `.max()`, `.gt()`, `.lt()`), coercion pattern |
| [`zod-temporal` (DASPRiD)](https://github.com/DASPRiD/zod-temporal) | Type coverage, config-per-type pattern, test categories, ISO string examples |
| [`zod-temporal` (klevente)](https://github.com/klevente/zod-temporal) | Edge case test inputs (malformed strings, overflow dates) |

---

## Non-Goals

- **No formatting** — Temporal objects have `.toString()`. We validate, not format.
- **No calendar system validation** — `Temporal.*.from()` handles calendars. We don't restrict which calendar is used.
- **No Moment/Luxon/dayjs interop** — this is Temporal-only.
- **No polyfill bundling** — the consumer's responsibility.
- **No `Temporal.Now` schema type** — "now" is a comparator value, not a type to validate against.

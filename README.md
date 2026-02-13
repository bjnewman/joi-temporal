# joi-temporal

Joi extension for validating and coercing [Temporal API](https://tc39.es/proposal-temporal/docs/) types.

[![npm version](https://img.shields.io/npm/v/@bjnewman/joi-temporal)](https://www.npmjs.com/package/@bjnewman/joi-temporal)
[![CI](https://img.shields.io/github/actions/workflow/status/bjnewman/joi-temporal/ci.yml?branch=main&label=CI)](https://github.com/bjnewman/joi-temporal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

```ts
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

const schema = custom.object({
    date: custom.plainDate().min("2020-01-01").max("2025-12-31"),
    time: custom.plainTime().min("09:00").max("17:00"),
    duration: custom.duration().positive().max("PT8H"),
});

const { value } = schema.validate({
    date: "2024-03-15",
    time: "14:30",
    duration: "PT2H30M",
});

value.date instanceof Temporal.PlainDate; // true
value.time instanceof Temporal.PlainTime; // true
value.duration instanceof Temporal.Duration; // true
```

## Why not @joi/date or joi-luxon?

Joi's existing date extensions (`@joi/date`, `@reis/joi-luxon`, `joi-date-dayjs`) all coerce to either `Date`, Luxon `DateTime`, or Day.js objects — and each comes with trade-offs:

| | @joi/date | @reis/joi-luxon | joi-temporal |
|---|---|---|---|
| **Coerces to** | `Date` | Luxon `DateTime` | Temporal types |
| **Timezones** | `.utc()` only | Yes (via Luxon) | Native `ZonedDateTime` |
| **Durations** | No | No | `Temporal.Duration` with `.positive()`, `.min()`, `.max()` |
| **Distinct date vs time** | No — everything is `Date` | No — everything is `DateTime` | `PlainDate`, `PlainTime`, `PlainDateTime`, `Instant`, etc. |
| **Runtime dep** | moment (format parsing) | Luxon | None — uses the platform |
| **Future** | moment is deprecated | Luxon is maintained | Temporal is a [TC39 standard](https://tc39.es/proposal-temporal/docs/), shipping in Chrome 137+, Firefox 139+, Node.js 22+ |

The [Temporal API](https://tc39.es/proposal-temporal/docs/) is the JavaScript standard that replaces `Date`. It's already native in major browsers and Node.js, and production-grade polyfills like [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) make it usable everywhere else today. Unlike library-specific types, Temporal objects are what the rest of the ecosystem is converging on.

- **Strings in, Temporal objects out** — ISO 8601 strings from JSON payloads are coerced to real Temporal instances. No manual parsing.
- **Feels native to Joi** — same `.min()`, `.max()`, `.required()`, `.messages()` chaining you already know.
- **All 8 Temporal types** — the right type for each use case instead of stuffing everything into `Date`.
- **Zero dependencies** — just your Joi peer dependency and a Temporal runtime.
- **`"now"` comparators** — `.min("now")` resolves at validation time, not schema construction time.
- **Polyfill now, native later** — swap the polyfill for native Temporal support with zero code changes.

## Install

```bash
npm install @bjnewman/joi-temporal
```

You'll also need the Temporal API available at runtime. Pick one:

| Environment | How to enable |
|---|---|
| **Node.js 22+** | `node --harmony-temporal app.js` |
| **Chrome 137+** / **Firefox 139+** | Ships natively |
| **Everywhere else** | `npm install temporal-polyfill` and `import "temporal-polyfill/global"` at your entry point |

**Peer dependency:** `joi >= 17.0.0`

## Supported Types

| Method | Temporal Type | Example Input |
|--------|--------------|---------------|
| `plainDate()` | `Temporal.PlainDate` | `"2024-03-15"` |
| `plainTime()` | `Temporal.PlainTime` | `"14:30:00"` |
| `plainDateTime()` | `Temporal.PlainDateTime` | `"2024-03-15T14:30:00"` |
| `zonedDateTime()` | `Temporal.ZonedDateTime` | `"2024-03-15T14:30:00-04:00[America/New_York]"` |
| `instant()` | `Temporal.Instant` | `"2024-03-15T14:30:00Z"` |
| `duration()` | `Temporal.Duration` | `"PT2H30M"` |
| `plainYearMonth()` | `Temporal.PlainYearMonth` | `"2024-03"` |
| `plainMonthDay()` | `Temporal.PlainMonthDay` | `"03-15"` |

All types coerce from ISO 8601 strings and pass through existing Temporal instances.

## API

### Comparison Rules

Available on all types except `plainMonthDay`:

```ts
custom.plainDate().min("2020-01-01")   // >= (inclusive)
custom.plainDate().max("2025-12-31")   // <= (inclusive)
custom.plainDate().gt("2020-01-01")    // >  (exclusive)
custom.plainDate().lt("2025-12-31")    // <  (exclusive)
custom.plainDate().gte("2020-01-01")   // alias for .min()
custom.plainDate().lte("2025-12-31")   // alias for .max()
```

Comparators accept ISO strings or Temporal instances. `plainDate`, `plainDateTime`, and `plainTime` also accept `"now"`.

### Duration Rules

```ts
custom.duration().positive()   // sign must be > 0
custom.duration().negative()   // sign must be < 0
custom.duration().nonzero()    // sign must not be 0
custom.duration().min("PT1H")  // at least 1 hour
custom.duration().max("P1D")   // at most 1 day
```

### ZonedDateTime Timezone

```ts
custom.zonedDateTime().timezone("America/New_York")
```

## Usage with Hapi

ISO strings in JSON payloads are coerced to Temporal objects before your handler runs:

```ts
import Hapi from "@hapi/hapi";
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

server.route({
    method: "POST",
    path: "/bookings",
    options: {
        validate: {
            payload: custom.object({
                date: custom.plainDate().min("now").max("2026-12-31").required(),
                startTime: custom.plainTime().min("09:00").max("17:00").required(),
                duration: custom.duration().positive().min("PT30M").max("PT4H").required(),
            }),
        },
    },
    handler(request) {
        const { date, startTime, duration } = request.payload;
        const end = startTime.add(duration); // already Temporal objects
        return { date: date.toString(), start: startTime.toString(), end: end.toString() };
    },
});
```

## Usage with React Hook Form

Works with [@hookform/resolvers](https://github.com/react-hook-form/resolvers) and HTML date/time inputs, which produce ISO strings that joi-temporal coerces automatically:

```ts
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

const schema = custom.object({
    startDate: custom.plainDate().min("now").required()
        .messages({ "temporal.plainDate.min": "Date must be today or later" }),
    meetingTime: custom.plainTime().min("08:00").max("18:00").required()
        .messages({ "temporal.plainTime.min": "Must be during business hours" }),
});

const { register, handleSubmit } = useForm({ resolver: joiResolver(schema) });
// <input type="date" {...register("startDate")} />
// <input type="time" {...register("meetingTime")} />
```

## Error Messages

Every error code can be overridden with `.messages()`:

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

The `{#limit}` token is replaced with the ISO string representation of the comparator.

## License

MIT

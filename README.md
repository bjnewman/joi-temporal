# joi-temporal

Joi extension for validating and coercing [Temporal API](https://tc39.es/proposal-temporal/docs/) types.

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

## Install

```bash
npm install @bjnewman/joi-temporal
```

**Requires the Temporal API at runtime.** Use one of:

- Node.js 22+ with `--harmony-temporal`
- Chrome 144+ / Firefox 139+ (native)
- A polyfill: [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) or [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill)

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

## Comparison Rules

Available on all types except `plainMonthDay`:

```ts
custom.plainDate().min("2020-01-01")   // >= (inclusive)
custom.plainDate().max("2025-12-31")   // <= (inclusive)
custom.plainDate().gt("2020-01-01")    // >  (exclusive)
custom.plainDate().lt("2025-12-31")    // <  (exclusive)
custom.plainDate().gte("2020-01-01")   // alias for .min()
custom.plainDate().lte("2025-12-31")   // alias for .max()
```

Comparators accept ISO strings or Temporal instances. `plainDate`, `plainDateTime`, and `plainTime` also accept `"now"` as a comparator, resolved at validation time.

## Duration-Specific Rules

```ts
custom.duration().positive()   // sign must be > 0
custom.duration().negative()   // sign must be < 0
custom.duration().nonzero()    // sign must not be 0
custom.duration().min("PT1H")  // at least 1 hour
custom.duration().max("P1D")   // at most 1 day
```

## ZonedDateTime Timezone Rule

```ts
custom.zonedDateTime().timezone("America/New_York")
```

Requires the value to be in a specific IANA timezone.

## Usage with Hapi

joi-temporal works as a drop-in with Hapi's route validation. Temporal objects arrive as ISO strings in JSON request payloads — the extension coerces them before your handler runs.

```ts
import Hapi from "@hapi/hapi";
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

const server = Hapi.server({ port: 3000 });

server.route({
    method: "POST",
    path: "/bookings",
    options: {
        validate: {
            payload: custom.object({
                date: custom.plainDate()
                    .min("now")
                    .max("2026-12-31")
                    .required(),
                startTime: custom.plainTime()
                    .min("09:00")
                    .max("17:00")
                    .required(),
                duration: custom.duration()
                    .positive()
                    .min("PT30M")
                    .max("PT4H")
                    .required(),
                timezone: custom.zonedDateTime()
                    .timezone("America/New_York")
                    .optional(),
            }),
        },
    },
    handler(request) {
        const { date, startTime, duration } = request.payload;

        // These are already Temporal objects — no parsing needed
        const end = startTime.add(duration);

        return {
            booking: {
                date: date.toString(),
                start: startTime.toString(),
                end: end.toString(),
            },
        };
    },
});
```

Valid request:

```json
{
    "date": "2026-04-15",
    "startTime": "10:00",
    "duration": "PT1H30M"
}
```

Invalid request — Hapi returns a 400 with Joi's error details automatically:

```json
{
    "date": "2020-01-01",
    "startTime": "22:00",
    "duration": "PT12H"
}
```

## Usage with React Hook Form

For browser-side validation with [React Hook Form](https://react-hook-form.com/) and [@hookform/resolvers](https://github.com/react-hook-form/resolvers), add a Temporal polyfill to your app entry point and use the Joi resolver.

```bash
npm install react-hook-form @hookform/resolvers joi @bjnewman/joi-temporal temporal-polyfill
```

Add the polyfill import at your app entry point (e.g., `main.tsx`):

```ts
import "temporal-polyfill/global";
```

Then use it in a form component:

```tsx
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

const schema = custom.object({
    startDate: custom.plainDate()
        .min("now")
        .required()
        .messages({
            "temporal.plainDate.base": "Please enter a valid date (YYYY-MM-DD)",
            "temporal.plainDate.min": "Date must be today or later",
            "any.required": "Start date is required",
        }),
    endDate: custom.plainDate()
        .min("now")
        .required(),
    meetingTime: custom.plainTime()
        .min("08:00")
        .max("18:00")
        .required()
        .messages({
            "temporal.plainTime.min": "Must be during business hours (8am–6pm)",
            "temporal.plainTime.max": "Must be during business hours (8am–6pm)",
        }),
});

export function BookingForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: joiResolver(schema),
    });

    const onSubmit = (data) => {
        // data.startDate is a Temporal.PlainDate
        // data.meetingTime is a Temporal.PlainTime
        console.log(data.startDate.toString());
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label htmlFor="startDate">Start Date</label>
                <input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <span>{errors.startDate.message}</span>}
            </div>

            <div>
                <label htmlFor="endDate">End Date</label>
                <input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && <span>{errors.endDate.message}</span>}
            </div>

            <div>
                <label htmlFor="meetingTime">Meeting Time</label>
                <input id="meetingTime" type="time" {...register("meetingTime")} />
                {errors.meetingTime && <span>{errors.meetingTime.message}</span>}
            </div>

            <button type="submit">Book</button>
        </form>
    );
}
```

HTML `<input type="date">` produces `"YYYY-MM-DD"` strings and `<input type="time">` produces `"HH:MM"` strings — both are valid ISO 8601 that joi-temporal coerces automatically.

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

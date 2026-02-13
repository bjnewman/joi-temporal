/// <reference types="temporal-polyfill/global" />

if (typeof globalThis.Temporal === "undefined") {
    throw new Error(
        "joi-temporal requires the Temporal API. " +
            "Use a supported runtime (Node 22+ with --harmony-temporal, Chrome 144+, Firefox 139+) " +
            "or install a polyfill (temporal-polyfill, @js-temporal/polyfill).",
    );
}

import type Joi from "joi";

// ── Config ──────────────────────────────────────────────────

interface TypeConfig {
    name: string;
    check: (v: unknown) => boolean;
    parse: (v: string) => unknown;
    baseMessage: string;
    compare?: (a: any, b: any) => number;
    compareMessages?: { min: string; max: string; gt: string; lt: string };
    now?: () => unknown;
    extraMessages?: Record<string, string>;
    extraRules?: Record<string, any>;
}

const DEFAULT_COMPARE = {
    min: "{{#label}} must be on or after {#limit}",
    max: "{{#label}} must be on or before {#limit}",
    gt: "{{#label}} must be after {#limit}",
    lt: "{{#label}} must be before {#limit}",
};

const CHECKS: [string, (c: number) => boolean][] = [
    ["min", (c) => c >= 0],
    ["max", (c) => c <= 0],
    ["gt", (c) => c > 0],
    ["lt", (c) => c < 0],
];

// ── Factory ─────────────────────────────────────────────────

function makeExtension(config: TypeConfig): Joi.ExtensionFactory {
    const p = `temporal.${config.name}`;

    return (joi: Joi.Root) => {
        const messages: Record<string, string> = {
            [`${p}.base`]: config.baseMessage,
        };
        const rules: Record<string, any> = {};

        if (config.compare) {
            const msgs = { ...DEFAULT_COMPARE, ...config.compareMessages };

            for (const [rule, check] of CHECKS) {
                messages[`${p}.${rule}`] = msgs[rule as keyof typeof msgs];
                rules[rule] = {
                    method(this: any, limit: unknown) {
                        return this.$_addRule({ name: rule, args: { limit } });
                    },
                    args: [{ name: "limit", ref: true, assert: (v: unknown) => typeof v === "string" || config.check(v), message: "must be a string or Temporal instance" }],
                    validate(value: unknown, helpers: any, { limit }: { limit: unknown }) {
                        const resolved =
                            limit === "now" && config.now
                                ? config.now()
                                : typeof limit === "string"
                                  ? config.parse(limit)
                                  : limit;
                        if (!check(config.compare!(value, resolved))) {
                            return helpers.error(`${p}.${rule}`, { limit: String(resolved) });
                        }
                        return value;
                    },
                };
            }

            rules.gte = { method(this: any, limit: unknown) { return this.min(limit); } };
            rules.lte = { method(this: any, limit: unknown) { return this.max(limit); } };
        }

        if (config.extraMessages) Object.assign(messages, config.extraMessages);
        if (config.extraRules) Object.assign(rules, config.extraRules);

        return {
            type: config.name,
            base: joi.any(),
            messages,
            coerce(value: unknown, helpers: any) {
                if (value == null || config.check(value)) return { value };
                if (typeof value !== "string") return { errors: helpers.error(`${p}.base`) };
                try {
                    return { value: config.parse(value) };
                } catch {
                    return { errors: helpers.error(`${p}.base`) };
                }
            },
            validate(value: unknown, helpers: any) {
                if (!config.check(value)) return { value, errors: helpers.error(`${p}.base`) };
                return { value };
            },
            rules,
        };
    };
}

// ── Types ───────────────────────────────────────────────────

const extensions = [
    makeExtension({
        name: "plainDate",
        check: (v) => v instanceof Temporal.PlainDate,
        parse: (v) => Temporal.PlainDate.from(v),
        compare: (a, b) => Temporal.PlainDate.compare(a, b),
        now: () => Temporal.Now.plainDateISO(),
        baseMessage: "{{#label}} must be a valid ISO 8601 date string or Temporal.PlainDate",
    }),
    makeExtension({
        name: "plainTime",
        check: (v) => v instanceof Temporal.PlainTime,
        parse: (v) => Temporal.PlainTime.from(v),
        compare: (a, b) => Temporal.PlainTime.compare(a, b),
        now: () => Temporal.Now.plainTimeISO(),
        baseMessage: "{{#label}} must be a valid ISO 8601 time string or Temporal.PlainTime",
    }),
    makeExtension({
        name: "plainDateTime",
        check: (v) => v instanceof Temporal.PlainDateTime,
        parse: (v) => Temporal.PlainDateTime.from(v),
        compare: (a, b) => Temporal.PlainDateTime.compare(a, b),
        now: () => Temporal.Now.plainDateTimeISO(),
        baseMessage:
            "{{#label}} must be a valid ISO 8601 date-time string or Temporal.PlainDateTime",
    }),
    makeExtension({
        name: "zonedDateTime",
        check: (v) => v instanceof Temporal.ZonedDateTime,
        parse: (v) => Temporal.ZonedDateTime.from(v),
        compare: (a, b) => Temporal.ZonedDateTime.compare(a, b),
        baseMessage:
            "{{#label}} must be a valid ISO 8601 date-time string with timezone or Temporal.ZonedDateTime",
        extraMessages: {
            "temporal.zonedDateTime.timezone": "{{#label}} must be in timezone {#timezone}",
        },
        extraRules: {
            timezone: {
                method(this: any, tz: string) {
                    return this.$_addRule({ name: "timezone", args: { tz } });
                },
                validate(value: Temporal.ZonedDateTime, helpers: any, { tz }: { tz: string }) {
                    if (value.timeZoneId !== tz) {
                        return helpers.error("temporal.zonedDateTime.timezone", { timezone: tz });
                    }
                    return value;
                },
            },
        },
    }),
    makeExtension({
        name: "instant",
        check: (v) => v instanceof Temporal.Instant,
        parse: (v) => Temporal.Instant.from(v),
        compare: (a, b) => Temporal.Instant.compare(a, b),
        baseMessage:
            "{{#label}} must be a valid ISO 8601 string with offset or Temporal.Instant",
    }),
    makeExtension({
        name: "duration",
        check: (v) => v instanceof Temporal.Duration,
        parse: (v) => Temporal.Duration.from(v),
        compare: (a, b) =>
            Temporal.Duration.compare(a, b, { relativeTo: Temporal.Now.plainDateISO() }),
        compareMessages: {
            min: "{{#label}} must be at least {#limit}",
            max: "{{#label}} must be at most {#limit}",
            gt: "{{#label}} must be more than {#limit}",
            lt: "{{#label}} must be less than {#limit}",
        },
        baseMessage:
            "{{#label}} must be a valid ISO 8601 duration string or Temporal.Duration",
        extraMessages: {
            "temporal.duration.positive": "{{#label}} must be a positive duration",
            "temporal.duration.negative": "{{#label}} must be a negative duration",
            "temporal.duration.nonzero": "{{#label}} must not be zero",
        },
        extraRules: {
            positive: {
                method(this: any) { return this.$_addRule("positive"); },
                validate(value: Temporal.Duration, helpers: any) {
                    if (value.sign <= 0) return helpers.error("temporal.duration.positive");
                    return value;
                },
            },
            negative: {
                method(this: any) { return this.$_addRule("negative"); },
                validate(value: Temporal.Duration, helpers: any) {
                    if (value.sign >= 0) return helpers.error("temporal.duration.negative");
                    return value;
                },
            },
            nonzero: {
                method(this: any) { return this.$_addRule("nonzero"); },
                validate(value: Temporal.Duration, helpers: any) {
                    if (value.sign === 0) return helpers.error("temporal.duration.nonzero");
                    return value;
                },
            },
        },
    }),
    makeExtension({
        name: "plainYearMonth",
        check: (v) => v instanceof Temporal.PlainYearMonth,
        parse: (v) => Temporal.PlainYearMonth.from(v),
        compare: (a, b) => Temporal.PlainYearMonth.compare(a, b),
        baseMessage:
            "{{#label}} must be a valid ISO 8601 year-month string or Temporal.PlainYearMonth",
    }),
    makeExtension({
        name: "plainMonthDay",
        check: (v) => v instanceof Temporal.PlainMonthDay,
        parse: (v) => Temporal.PlainMonthDay.from(v),
        baseMessage:
            "{{#label}} must be a valid ISO 8601 month-day string or Temporal.PlainMonthDay",
    }),
];

export default extensions;

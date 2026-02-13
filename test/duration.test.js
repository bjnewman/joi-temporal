import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("duration", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a time-only duration string", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "PT1H30M");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.hours, 1);
            assert.equal(result.minutes, 30);
        });
        it("should coerce a date-only duration string", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "P1Y2M3D");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.years, 1);
            assert.equal(result.months, 2);
            assert.equal(result.days, 3);
        });
        it("should coerce a combined date-time duration", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "P1DT12H");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.days, 1);
            assert.equal(result.hours, 12);
        });
        it("should coerce a zero duration", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "PT0S");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.total({ unit: "seconds" }), 0);
        });
        it("should coerce a negative duration", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "-PT1H");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.sign, -1);
        });
        it("should pass through an existing Duration instance", () => {
            const schema = custom.duration();
            const input = Temporal.Duration.from("PT10M");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.Duration);
            assert.equal(result.minutes, 10);
        });
        it("should reject an invalid string", () => {
            const schema = custom.duration();
            expectError(schema, "foo", "temporal.duration.base");
        });
        it("should reject a number", () => {
            const schema = custom.duration();
            expectError(schema, 42, "temporal.duration.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.duration();
            expectError(schema, "", "temporal.duration.base");
        });
        it("should reject a date string (not a duration)", () => {
            const schema = custom.duration();
            expectError(schema, "2021-01-15", "temporal.duration.base");
        });
        it("should respect .required()", () => {
            const schema = custom.duration().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional()", () => {
            const schema = custom.duration().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.duration().min("PT1H");
            expectPass(schema, "PT1H");
        });
        it("should pass when value exceeds the min boundary", () => {
            const schema = custom.duration().min("PT1H");
            expectPass(schema, "PT2H");
        });
        it("should fail when value is less than the min boundary", () => {
            const schema = custom.duration().min("PT1H");
            const error = expectError(schema, "PT30M", "temporal.duration.min");
            assert(error.message.includes("PT1H"));
        });
        it("should accept a Duration instance as the limit", () => {
            const limit = Temporal.Duration.from("PT1H");
            const schema = custom.duration().min(limit);
            expectPass(schema, "PT2H");
            expectError(schema, "PT30M", "temporal.duration.min");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.duration().max("PT8H");
            expectPass(schema, "PT8H");
        });
        it("should pass when value is less than the max boundary", () => {
            const schema = custom.duration().max("PT8H");
            expectPass(schema, "PT4H");
        });
        it("should fail when value exceeds the max boundary", () => {
            const schema = custom.duration().max("PT8H");
            const error = expectError(schema, "PT9H", "temporal.duration.max");
            assert(error.message.includes("PT8H"));
        });
    });
    describe("chained rules", () => {
        it("should enforce both min and max", () => {
            const schema = custom.duration().min("PT30M").max("PT8H");
            expectPass(schema, "PT4H");
            expectError(schema, "PT10M", "temporal.duration.min");
            expectError(schema, "PT10H", "temporal.duration.max");
        });
    });
    // ── Type-specific rules ───────────────────────────────────
    describe("positive", () => {
        it("should pass for a positive duration", () => {
            const schema = custom.duration().positive();
            expectPass(schema, "PT1H");
        });
        it("should fail for a negative duration", () => {
            const schema = custom.duration().positive();
            expectError(schema, "-PT1H", "temporal.duration.positive");
        });
        it("should fail for a zero duration", () => {
            const schema = custom.duration().positive();
            expectError(schema, "PT0S", "temporal.duration.positive");
        });
    });
    describe("negative", () => {
        it("should pass for a negative duration", () => {
            const schema = custom.duration().negative();
            expectPass(schema, "-PT1H");
        });
        it("should fail for a positive duration", () => {
            const schema = custom.duration().negative();
            expectError(schema, "PT1H", "temporal.duration.negative");
        });
        it("should fail for a zero duration", () => {
            const schema = custom.duration().negative();
            expectError(schema, "PT0S", "temporal.duration.negative");
        });
    });
    describe("nonzero", () => {
        it("should pass for a positive duration", () => {
            const schema = custom.duration().nonzero();
            expectPass(schema, "PT1H");
        });
        it("should pass for a negative duration", () => {
            const schema = custom.duration().nonzero();
            expectPass(schema, "-PT1H");
        });
        it("should fail for a zero duration", () => {
            const schema = custom.duration().nonzero();
            expectError(schema, "PT0S", "temporal.duration.nonzero");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                timeout: custom.duration().required(),
            });
            const { error, value } = schema.validate({ timeout: "PT30M" });
            assert.equal(error, undefined);
            assert(value.timeout instanceof Temporal.Duration);
        });
        it("should support .describe()", () => {
            const schema = custom.duration().min("PT1H").positive();
            const description = schema.describe();
            assert.equal(description.type, "duration");
            assert(Array.isArray(description.rules));
        });
        it("should support .default() with a factory function", () => {
            const schema = custom.duration().default(() => Temporal.Duration.from("PT1H"));
            const result = expectPass(schema, undefined);
            assert(result instanceof Temporal.Duration);
            assert.equal(result.hours, 1);
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    describe("edge cases", () => {
        it("should handle very large durations", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "P100Y");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.years, 100);
        });
        it("should handle fractional seconds", () => {
            const schema = custom.duration();
            const result = expectPass(schema, "PT0.5S");
            assert(result instanceof Temporal.Duration);
            assert.equal(result.milliseconds, 500);
        });
    });
});

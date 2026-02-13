import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("zonedDateTime", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a valid ISO string with timezone annotation", () => {
            const schema = custom.zonedDateTime();
            const result = expectPass(schema, "2021-01-15T14:30:00+01:00[Europe/Berlin]");
            assert(result instanceof Temporal.ZonedDateTime);
            assert.equal(result.year, 2021);
            assert.equal(result.month, 1);
            assert.equal(result.day, 15);
            assert.equal(result.timeZoneId, "Europe/Berlin");
        });
        it("should coerce a UTC timezone annotation", () => {
            const schema = custom.zonedDateTime();
            const result = expectPass(schema, "2021-01-15T14:30:00+00:00[UTC]");
            assert(result instanceof Temporal.ZonedDateTime);
            assert.equal(result.timeZoneId, "UTC");
        });
        it("should pass through an existing ZonedDateTime instance", () => {
            const schema = custom.zonedDateTime();
            const input = Temporal.ZonedDateTime.from("2021-01-15T14:30:00+01:00[Europe/Berlin]");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.ZonedDateTime);
            assert(result.equals(input));
        });
        it("should reject an invalid string", () => {
            const schema = custom.zonedDateTime();
            expectError(schema, "foo", "temporal.zonedDateTime.base");
        });
        it("should reject a number", () => {
            const schema = custom.zonedDateTime();
            expectError(schema, 42, "temporal.zonedDateTime.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.zonedDateTime();
            expectError(schema, "", "temporal.zonedDateTime.base");
        });
        it("should respect .required()", () => {
            const schema = custom.zonedDateTime().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional()", () => {
            const schema = custom.zonedDateTime().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.zonedDateTime().min("2021-01-01T00:00:00+00:00[UTC]");
            expectPass(schema, "2021-01-01T00:00:00+00:00[UTC]");
        });
        it("should pass when value is after the min boundary", () => {
            const schema = custom.zonedDateTime().min("2021-01-01T00:00:00+00:00[UTC]");
            expectPass(schema, "2021-06-15T12:00:00+00:00[UTC]");
        });
        it("should fail when value is before the min boundary", () => {
            const schema = custom.zonedDateTime().min("2021-01-01T00:00:00+00:00[UTC]");
            expectError(schema, "2020-12-31T23:59:59+00:00[UTC]", "temporal.zonedDateTime.min");
        });
        it("should compare as instants across timezones", () => {
            const schema = custom.zonedDateTime().min("2021-01-01T01:00:00+01:00[Europe/Berlin]");
            // Same instant in UTC (midnight UTC = 1am Berlin)
            expectPass(schema, "2021-01-01T00:00:00+00:00[UTC]");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.zonedDateTime().max("2025-12-31T23:59:59+00:00[UTC]");
            expectPass(schema, "2025-12-31T23:59:59+00:00[UTC]");
        });
        it("should fail when value is after the max boundary", () => {
            const schema = custom.zonedDateTime().max("2025-12-31T23:59:59+00:00[UTC]");
            expectError(schema, "2026-01-01T00:00:00+00:00[UTC]", "temporal.zonedDateTime.max");
        });
    });
    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.zonedDateTime().gt("2021-01-01T00:00:00+00:00[UTC]");
            expectError(schema, "2021-01-01T00:00:00+00:00[UTC]", "temporal.zonedDateTime.gt");
        });
        it("should pass when value is after the boundary", () => {
            const schema = custom.zonedDateTime().gt("2021-01-01T00:00:00+00:00[UTC]");
            expectPass(schema, "2021-01-01T00:00:01+00:00[UTC]");
        });
    });
    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.zonedDateTime().lt("2025-12-31T23:59:59+00:00[UTC]");
            expectError(schema, "2025-12-31T23:59:59+00:00[UTC]", "temporal.zonedDateTime.lt");
        });
        it("should pass when value is before the boundary", () => {
            const schema = custom.zonedDateTime().lt("2025-12-31T23:59:59+00:00[UTC]");
            expectPass(schema, "2025-12-31T23:59:58+00:00[UTC]");
        });
    });
    // ── Timezone rule ─────────────────────────────────────────
    describe("timezone", () => {
        it("should pass when timezone matches", () => {
            const schema = custom.zonedDateTime().timezone("America/New_York");
            expectPass(schema, "2021-06-15T12:00:00-04:00[America/New_York]");
        });
        it("should fail when timezone does not match", () => {
            const schema = custom.zonedDateTime().timezone("America/New_York");
            const error = expectError(schema, "2021-06-15T12:00:00+02:00[Europe/Berlin]", "temporal.zonedDateTime.timezone");
            assert(error.message.includes("America/New_York"));
        });
        it("should be chainable with comparison rules", () => {
            const schema = custom
                .zonedDateTime()
                .timezone("UTC")
                .min("2021-01-01T00:00:00+00:00[UTC]");
            expectPass(schema, "2021-06-15T12:00:00+00:00[UTC]");
            expectError(schema, "2021-06-15T12:00:00+02:00[Europe/Berlin]", "temporal.zonedDateTime.timezone");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                event: custom.zonedDateTime().required(),
            });
            const { error, value } = schema.validate({
                event: "2021-01-15T14:30:00+01:00[Europe/Berlin]",
            });
            assert.equal(error, undefined);
            assert(value.event instanceof Temporal.ZonedDateTime);
        });
        it("should support .describe()", () => {
            const schema = custom.zonedDateTime().timezone("UTC");
            const description = schema.describe();
            assert.equal(description.type, "zonedDateTime");
        });
    });
});

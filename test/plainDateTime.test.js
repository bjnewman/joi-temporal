import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("plainDateTime", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a full ISO datetime string", () => {
            const schema = custom.plainDateTime();
            const result = expectPass(schema, "2021-01-15T14:30:00");
            assert(result instanceof Temporal.PlainDateTime);
            assert.equal(result.year, 2021);
            assert.equal(result.month, 1);
            assert.equal(result.day, 15);
            assert.equal(result.hour, 14);
            assert.equal(result.minute, 30);
        });
        it("should coerce a datetime without seconds", () => {
            const schema = custom.plainDateTime();
            const result = expectPass(schema, "2021-01-15T14:30");
            assert(result instanceof Temporal.PlainDateTime);
            assert.equal(result.second, 0);
        });
        it("should coerce a date-only string (time defaults to midnight)", () => {
            const schema = custom.plainDateTime();
            const result = expectPass(schema, "2021-01-15");
            assert(result instanceof Temporal.PlainDateTime);
            assert.equal(result.hour, 0);
            assert.equal(result.minute, 0);
        });
        it("should pass through an existing PlainDateTime instance", () => {
            const schema = custom.plainDateTime();
            const input = Temporal.PlainDateTime.from("2021-01-15T14:30:00");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.PlainDateTime);
            assert(result.equals(input));
        });
        it("should reject an invalid string", () => {
            const schema = custom.plainDateTime();
            expectError(schema, "foo", "temporal.plainDateTime.base");
        });
        it("should reject a number", () => {
            const schema = custom.plainDateTime();
            expectError(schema, 42, "temporal.plainDateTime.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.plainDateTime();
            expectError(schema, "", "temporal.plainDateTime.base");
        });
        it("should respect .required()", () => {
            const schema = custom.plainDateTime().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional()", () => {
            const schema = custom.plainDateTime().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.plainDateTime().min("2021-01-01T00:00:00");
            expectPass(schema, "2021-01-01T00:00:00");
        });
        it("should pass when value is after the min boundary", () => {
            const schema = custom.plainDateTime().min("2021-01-01T00:00:00");
            expectPass(schema, "2021-06-15T12:00:00");
        });
        it("should fail when value is before the min boundary", () => {
            const schema = custom.plainDateTime().min("2021-01-01T00:00:00");
            expectError(schema, "2020-12-31T23:59:59", "temporal.plainDateTime.min");
        });
        it("should accept a PlainDateTime instance as the limit", () => {
            const limit = Temporal.PlainDateTime.from("2021-01-01T00:00:00");
            const schema = custom.plainDateTime().min(limit);
            expectPass(schema, "2021-06-15T12:00:00");
            expectError(schema, "2020-06-15T12:00:00", "temporal.plainDateTime.min");
        });
        it("should accept 'now' as the limit", () => {
            const schema = custom.plainDateTime().min("now");
            const tomorrow = Temporal.Now.plainDateTimeISO().add({ days: 1 });
            expectPass(schema, tomorrow.toString());
            const yesterday = Temporal.Now.plainDateTimeISO().subtract({ days: 1 });
            expectError(schema, yesterday.toString(), "temporal.plainDateTime.min");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.plainDateTime().max("2025-12-31T23:59:59");
            expectPass(schema, "2025-12-31T23:59:59");
        });
        it("should fail when value is after the max boundary", () => {
            const schema = custom.plainDateTime().max("2025-12-31T23:59:59");
            expectError(schema, "2026-01-01T00:00:00", "temporal.plainDateTime.max");
        });
    });
    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainDateTime().gt("2021-01-01T00:00:00");
            expectError(schema, "2021-01-01T00:00:00", "temporal.plainDateTime.gt");
        });
        it("should pass when value is after the boundary", () => {
            const schema = custom.plainDateTime().gt("2021-01-01T00:00:00");
            expectPass(schema, "2021-01-01T00:00:01");
        });
    });
    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainDateTime().lt("2025-12-31T23:59:59");
            expectError(schema, "2025-12-31T23:59:59", "temporal.plainDateTime.lt");
        });
        it("should pass when value is before the boundary", () => {
            const schema = custom.plainDateTime().lt("2025-12-31T23:59:59");
            expectPass(schema, "2025-12-31T23:59:58");
        });
    });
    describe("chained rules", () => {
        it("should enforce both min and max", () => {
            const schema = custom
                .plainDateTime()
                .min("2021-01-01T00:00:00")
                .max("2025-12-31T23:59:59");
            expectPass(schema, "2023-06-15T12:00:00");
            expectError(schema, "2020-01-01T00:00:00", "temporal.plainDateTime.min");
            expectError(schema, "2026-06-15T12:00:00", "temporal.plainDateTime.max");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                timestamp: custom.plainDateTime().required(),
            });
            const { error, value } = schema.validate({ timestamp: "2021-01-15T14:30:00" });
            assert.equal(error, undefined);
            assert(value.timestamp instanceof Temporal.PlainDateTime);
        });
        it("should support .describe()", () => {
            const schema = custom.plainDateTime().min("2021-01-01T00:00:00");
            const description = schema.describe();
            assert.equal(description.type, "plainDateTime");
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    describe("edge cases", () => {
        it("should reject overflow date in datetime", () => {
            const schema = custom.plainDateTime();
            expectError(schema, "2021-02-31T12:00:00", "temporal.plainDateTime.base");
        });
        it("should accept leap year datetime", () => {
            const schema = custom.plainDateTime();
            const result = expectPass(schema, "2024-02-29T12:00:00");
            assert.equal(result.month, 2);
            assert.equal(result.day, 29);
        });
    });
});

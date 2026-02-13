import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("plainDate", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a valid ISO date string to PlainDate", () => {
            const schema = custom.plainDate();
            const result = expectPass(schema, "2021-01-15");
            assert(result instanceof Temporal.PlainDate);
            assert.equal(result.year, 2021);
            assert.equal(result.month, 1);
            assert.equal(result.day, 15);
        });
        it("should pass through an existing PlainDate instance", () => {
            const schema = custom.plainDate();
            const input = Temporal.PlainDate.from("2021-06-15");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.PlainDate);
            assert(result.equals(input));
        });
        it("should reject an invalid date string", () => {
            const schema = custom.plainDate();
            expectError(schema, "foo", "temporal.plainDate.base");
        });
        it("should reject a number", () => {
            const schema = custom.plainDate();
            expectError(schema, 42, "temporal.plainDate.base");
        });
        it("should reject a boolean", () => {
            const schema = custom.plainDate();
            expectError(schema, true, "temporal.plainDate.base");
        });
        it("should reject a plain object", () => {
            const schema = custom.plainDate();
            expectError(schema, { year: 2021 }, "temporal.plainDate.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.plainDate();
            expectError(schema, "", "temporal.plainDate.base");
        });
        it("should reject a whitespace-padded string", () => {
            const schema = custom.plainDate();
            expectError(schema, " 2021-01-15 ", "temporal.plainDate.base");
        });
        it("should respect .required() — undefined fails", () => {
            const schema = custom.plainDate().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional() — undefined passes", () => {
            const schema = custom.plainDate().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
        it("should respect .allow(null)", () => {
            const schema = custom.plainDate().allow(null);
            const result = expectPass(schema, null);
            assert.equal(result, null);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.plainDate().min("2021-01-01");
            const result = expectPass(schema, "2021-01-01");
            assert(result instanceof Temporal.PlainDate);
        });
        it("should pass when value is after the min boundary", () => {
            const schema = custom.plainDate().min("2021-01-01");
            expectPass(schema, "2021-06-15");
        });
        it("should fail when value is before the min boundary", () => {
            const schema = custom.plainDate().min("2021-01-01");
            const error = expectError(schema, "2020-12-31", "temporal.plainDate.min");
            assert(error.message.includes("2021-01-01"));
        });
        it("should accept a Temporal.PlainDate as the limit", () => {
            const limit = Temporal.PlainDate.from("2021-01-01");
            const schema = custom.plainDate().min(limit);
            expectPass(schema, "2021-06-15");
            expectError(schema, "2020-06-15", "temporal.plainDate.min");
        });
        it("should accept 'now' as the limit", () => {
            const schema = custom.plainDate().min("now");
            const today = Temporal.Now.plainDateISO();
            expectPass(schema, today.toString());
            const yesterday = today.subtract({ days: 1 });
            expectError(schema, yesterday.toString(), "temporal.plainDate.min");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.plainDate().max("2025-12-31");
            expectPass(schema, "2025-12-31");
        });
        it("should pass when value is before the max boundary", () => {
            const schema = custom.plainDate().max("2025-12-31");
            expectPass(schema, "2021-01-01");
        });
        it("should fail when value is after the max boundary", () => {
            const schema = custom.plainDate().max("2025-12-31");
            const error = expectError(schema, "2026-01-01", "temporal.plainDate.max");
            assert(error.message.includes("2025-12-31"));
        });
    });
    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainDate().gt("2021-01-01");
            expectError(schema, "2021-01-01", "temporal.plainDate.gt");
        });
        it("should pass when value is after the boundary", () => {
            const schema = custom.plainDate().gt("2021-01-01");
            expectPass(schema, "2021-01-02");
        });
    });
    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainDate().lt("2025-12-31");
            expectError(schema, "2025-12-31", "temporal.plainDate.lt");
        });
        it("should pass when value is before the boundary", () => {
            const schema = custom.plainDate().lt("2025-12-31");
            expectPass(schema, "2025-12-30");
        });
    });
    describe("chained rules", () => {
        it("should enforce both min and max", () => {
            const schema = custom.plainDate().min("2021-01-01").max("2025-12-31");
            expectPass(schema, "2023-06-15");
            expectError(schema, "2020-01-01", "temporal.plainDate.min");
            expectError(schema, "2026-06-15", "temporal.plainDate.max");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                date: custom.plainDate().required(),
            });
            const { error, value } = schema.validate({ date: "2021-01-15" });
            assert.equal(error, undefined);
            assert(value.date instanceof Temporal.PlainDate);
        });
        it("should support .default() with a factory function", () => {
            const schema = custom.plainDate().default(() => Temporal.PlainDate.from("2021-01-01"));
            const result = expectPass(schema, undefined);
            assert(result instanceof Temporal.PlainDate);
            assert.equal(result.toString(), "2021-01-01");
        });
        it("should support custom error messages via .messages()", () => {
            const schema = custom.plainDate().messages({
                "temporal.plainDate.base": "{{#label}} is not a date!",
            });
            const error = expectError(schema, "foo");
            assert.equal(error.details[0].message, '"value" is not a date!');
        });
        it("should support .describe()", () => {
            const schema = custom.plainDate().min("2020-01-01").max("2025-12-31");
            const description = schema.describe();
            assert.equal(description.type, "plainDate");
            assert(Array.isArray(description.rules));
            assert.equal(description.rules.length, 2);
            assert.equal(description.rules[0].name, "min");
            assert.equal(description.rules[1].name, "max");
        });
        it("should not coerce when convert: false and value is a string", () => {
            const schema = custom.plainDate();
            const { error } = schema.validate("2021-01-15", { convert: false });
            assert(error !== undefined);
        });
        it("should pass when convert: false and value is already a PlainDate", () => {
            const schema = custom.plainDate();
            const input = Temporal.PlainDate.from("2021-01-15");
            const { error } = schema.validate(input, { convert: false });
            assert.equal(error, undefined);
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    describe("edge cases", () => {
        it("should reject overflow date 2021-02-31", () => {
            const schema = custom.plainDate();
            expectError(schema, "2021-02-31", "temporal.plainDate.base");
        });
        it("should accept leap year date 2024-02-29", () => {
            const schema = custom.plainDate();
            const result = expectPass(schema, "2024-02-29");
            assert.equal(result.month, 2);
            assert.equal(result.day, 29);
        });
        it("should reject non-leap year date 2023-02-29", () => {
            const schema = custom.plainDate();
            expectError(schema, "2023-02-29", "temporal.plainDate.base");
        });
    });
});

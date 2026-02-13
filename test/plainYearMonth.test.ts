import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";

describe("plainYearMonth", () => {
    // ── Coercion ──────────────────────────────────────────────

    describe("coercion", () => {
        it("should coerce a valid YYYY-MM string", () => {
            const schema = custom.plainYearMonth();
            const result = expectPass(schema, "2021-01");
            assert(result instanceof Temporal.PlainYearMonth);
            assert.equal(result.year, 2021);
            assert.equal(result.month, 1);
        });

        it("should pass through an existing PlainYearMonth instance", () => {
            const schema = custom.plainYearMonth();
            const input = Temporal.PlainYearMonth.from("2021-06");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.PlainYearMonth);
            assert(result.equals(input));
        });

        it("should reject an invalid string", () => {
            const schema = custom.plainYearMonth();
            expectError(schema, "foo", "temporal.plainYearMonth.base");
        });

        it("should reject an out-of-range month", () => {
            const schema = custom.plainYearMonth();
            expectError(schema, "2021-13", "temporal.plainYearMonth.base");
        });

        it("should reject a number", () => {
            const schema = custom.plainYearMonth();
            expectError(schema, 42, "temporal.plainYearMonth.base");
        });

        it("should reject an empty string", () => {
            const schema = custom.plainYearMonth();
            expectError(schema, "", "temporal.plainYearMonth.base");
        });

        it("should respect .required()", () => {
            const schema = custom.plainYearMonth().required();
            expectError(schema, undefined, "any.required");
        });

        it("should respect .optional()", () => {
            const schema = custom.plainYearMonth().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });

    // ── Comparison rules ──────────────────────────────────────

    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.plainYearMonth().min("2021-01");
            expectPass(schema, "2021-01");
        });

        it("should pass when value is after the min boundary", () => {
            const schema = custom.plainYearMonth().min("2021-01");
            expectPass(schema, "2021-06");
        });

        it("should fail when value is before the min boundary", () => {
            const schema = custom.plainYearMonth().min("2021-01");
            expectError(schema, "2020-12", "temporal.plainYearMonth.min");
        });

        it("should accept a PlainYearMonth instance as the limit", () => {
            const limit = Temporal.PlainYearMonth.from("2021-01");
            const schema = custom.plainYearMonth().min(limit);
            expectPass(schema, "2021-06");
            expectError(schema, "2020-06", "temporal.plainYearMonth.min");
        });
    });

    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.plainYearMonth().max("2025-12");
            expectPass(schema, "2025-12");
        });

        it("should fail when value is after the max boundary", () => {
            const schema = custom.plainYearMonth().max("2025-12");
            expectError(schema, "2026-01", "temporal.plainYearMonth.max");
        });
    });

    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainYearMonth().gt("2021-01");
            expectError(schema, "2021-01", "temporal.plainYearMonth.gt");
        });

        it("should pass when value is after the boundary", () => {
            const schema = custom.plainYearMonth().gt("2021-01");
            expectPass(schema, "2021-02");
        });
    });

    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainYearMonth().lt("2025-12");
            expectError(schema, "2025-12", "temporal.plainYearMonth.lt");
        });

        it("should pass when value is before the boundary", () => {
            const schema = custom.plainYearMonth().lt("2025-12");
            expectPass(schema, "2025-11");
        });
    });

    // ── Joi integration ───────────────────────────────────────

    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                billingMonth: custom.plainYearMonth().required(),
            });
            const { error, value } = schema.validate({ billingMonth: "2021-06" });
            assert.equal(error, undefined);
            assert(value.billingMonth instanceof Temporal.PlainYearMonth);
        });

        it("should support .describe()", () => {
            const schema = custom.plainYearMonth().min("2021-01");
            const description = schema.describe();
            assert.equal(description.type, "plainYearMonth");
        });
    });
});

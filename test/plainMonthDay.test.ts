import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";

describe("plainMonthDay", () => {
    // ── Coercion ──────────────────────────────────────────────

    describe("coercion", () => {
        it("should coerce a valid MM-DD string", () => {
            const schema = custom.plainMonthDay();
            const result = expectPass(schema, "12-30");
            assert(result instanceof Temporal.PlainMonthDay);
            assert.equal(result.monthCode, "M12");
            assert.equal(result.day, 30);
        });

        it("should coerce February 29 (valid month-day)", () => {
            const schema = custom.plainMonthDay();
            const result = expectPass(schema, "02-29");
            assert(result instanceof Temporal.PlainMonthDay);
            assert.equal(result.monthCode, "M02");
            assert.equal(result.day, 29);
        });

        it("should pass through an existing PlainMonthDay instance", () => {
            const schema = custom.plainMonthDay();
            const input = Temporal.PlainMonthDay.from("12-25");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.PlainMonthDay);
            assert(result.equals(input));
        });

        it("should reject an invalid string", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, "foo", "temporal.plainMonthDay.base");
        });

        it("should reject an out-of-range month", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, "13-01", "temporal.plainMonthDay.base");
        });

        it("should reject an out-of-range day", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, "01-32", "temporal.plainMonthDay.base");
        });

        it("should reject a number", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, 42, "temporal.plainMonthDay.base");
        });

        it("should reject an empty string", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, "", "temporal.plainMonthDay.base");
        });

        it("should respect .required()", () => {
            const schema = custom.plainMonthDay().required();
            expectError(schema, undefined, "any.required");
        });

        it("should respect .optional()", () => {
            const schema = custom.plainMonthDay().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });

    // ── No comparison rules ───────────────────────────────────
    // PlainMonthDay has no natural total ordering, so no min/max/gt/lt rules.

    // ── Joi integration ───────────────────────────────────────

    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                birthday: custom.plainMonthDay().required(),
            });
            const { error, value } = schema.validate({ birthday: "12-25" });
            assert.equal(error, undefined);
            assert(value.birthday instanceof Temporal.PlainMonthDay);
        });

        it("should support .describe()", () => {
            const schema = custom.plainMonthDay();
            const description = schema.describe();
            assert.equal(description.type, "plainMonthDay");
        });

        it("should support .allow(null)", () => {
            const schema = custom.plainMonthDay().allow(null);
            const result = expectPass(schema, null);
            assert.equal(result, null);
        });
    });

    // ── Edge cases ────────────────────────────────────────────

    describe("edge cases", () => {
        it("should accept Jan 1", () => {
            const schema = custom.plainMonthDay();
            const result = expectPass(schema, "01-01");
            assert.equal(result.monthCode, "M01");
            assert.equal(result.day, 1);
        });

        it("should accept Dec 31", () => {
            const schema = custom.plainMonthDay();
            const result = expectPass(schema, "12-31");
            assert.equal(result.monthCode, "M12");
            assert.equal(result.day, 31);
        });

        it("should reject April 31 (only 30 days)", () => {
            const schema = custom.plainMonthDay();
            expectError(schema, "04-31", "temporal.plainMonthDay.base");
        });
    });
});

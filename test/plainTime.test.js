import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("plainTime", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a valid ISO time string", () => {
            const schema = custom.plainTime();
            const result = expectPass(schema, "14:30:00");
            assert(result instanceof Temporal.PlainTime);
            assert.equal(result.hour, 14);
            assert.equal(result.minute, 30);
            assert.equal(result.second, 0);
        });
        it("should coerce a short time string without seconds", () => {
            const schema = custom.plainTime();
            const result = expectPass(schema, "14:30");
            assert(result instanceof Temporal.PlainTime);
            assert.equal(result.hour, 14);
            assert.equal(result.minute, 30);
        });
        it("should coerce a time string with fractional seconds", () => {
            const schema = custom.plainTime();
            const result = expectPass(schema, "14:30:00.123");
            assert(result instanceof Temporal.PlainTime);
            assert.equal(result.millisecond, 123);
        });
        it("should pass through an existing PlainTime instance", () => {
            const schema = custom.plainTime();
            const input = Temporal.PlainTime.from("20:00:00");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.PlainTime);
            assert(result.equals(input));
        });
        it("should reject an invalid time string", () => {
            const schema = custom.plainTime();
            expectError(schema, "foo", "temporal.plainTime.base");
        });
        it("should reject an out-of-range hour", () => {
            const schema = custom.plainTime();
            expectError(schema, "25:00:00", "temporal.plainTime.base");
        });
        it("should reject an out-of-range minute", () => {
            const schema = custom.plainTime();
            expectError(schema, "14:61:00", "temporal.plainTime.base");
        });
        it("should reject a number", () => {
            const schema = custom.plainTime();
            expectError(schema, 42, "temporal.plainTime.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.plainTime();
            expectError(schema, "", "temporal.plainTime.base");
        });
        it("should respect .required()", () => {
            const schema = custom.plainTime().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional()", () => {
            const schema = custom.plainTime().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.plainTime().min("09:00:00");
            expectPass(schema, "09:00:00");
        });
        it("should pass when value is after the min boundary", () => {
            const schema = custom.plainTime().min("09:00:00");
            expectPass(schema, "17:00:00");
        });
        it("should fail when value is before the min boundary", () => {
            const schema = custom.plainTime().min("09:00:00");
            const error = expectError(schema, "08:59:59", "temporal.plainTime.min");
            assert(error.message.includes("09:00:00"));
        });
        it("should accept a PlainTime instance as the limit", () => {
            const limit = Temporal.PlainTime.from("09:00:00");
            const schema = custom.plainTime().min(limit);
            expectPass(schema, "10:00:00");
            expectError(schema, "08:00:00", "temporal.plainTime.min");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.plainTime().max("17:00:00");
            expectPass(schema, "17:00:00");
        });
        it("should fail when value is after the max boundary", () => {
            const schema = custom.plainTime().max("17:00:00");
            expectError(schema, "17:00:01", "temporal.plainTime.max");
        });
    });
    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainTime().gt("09:00:00");
            expectError(schema, "09:00:00", "temporal.plainTime.gt");
        });
        it("should pass when value is after the boundary", () => {
            const schema = custom.plainTime().gt("09:00:00");
            expectPass(schema, "09:00:01");
        });
    });
    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.plainTime().lt("17:00:00");
            expectError(schema, "17:00:00", "temporal.plainTime.lt");
        });
        it("should pass when value is before the boundary", () => {
            const schema = custom.plainTime().lt("17:00:00");
            expectPass(schema, "16:59:59");
        });
    });
    describe("chained rules", () => {
        it("should enforce both min and max (business hours)", () => {
            const schema = custom.plainTime().min("09:00:00").max("17:00:00");
            expectPass(schema, "12:00:00");
            expectError(schema, "08:00:00", "temporal.plainTime.min");
            expectError(schema, "18:00:00", "temporal.plainTime.max");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                startTime: custom.plainTime().required(),
            });
            const { error, value } = schema.validate({ startTime: "09:30:00" });
            assert.equal(error, undefined);
            assert(value.startTime instanceof Temporal.PlainTime);
        });
        it("should support .describe()", () => {
            const schema = custom.plainTime().min("09:00:00");
            const description = schema.describe();
            assert.equal(description.type, "plainTime");
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    describe("edge cases", () => {
        it("should handle midnight as 00:00:00", () => {
            const schema = custom.plainTime();
            const result = expectPass(schema, "00:00:00");
            assert.equal(result.hour, 0);
            assert.equal(result.minute, 0);
        });
    });
});

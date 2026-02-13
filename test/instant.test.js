import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { custom, expectPass, expectError } from "./helpers.js";
describe("instant", () => {
    // ── Coercion ──────────────────────────────────────────────
    describe("coercion", () => {
        it("should coerce a valid ISO string with Z offset", () => {
            const schema = custom.instant();
            const result = expectPass(schema, "2021-01-15T14:30:00Z");
            assert(result instanceof Temporal.Instant);
        });
        it("should coerce a valid ISO string with numeric offset", () => {
            const schema = custom.instant();
            const result = expectPass(schema, "2021-01-15T14:30:00+05:30");
            assert(result instanceof Temporal.Instant);
        });
        it("should produce the correct instant from offset", () => {
            const schema = custom.instant();
            const resultZ = expectPass(schema, "2021-01-15T14:30:00Z");
            const resultOffset = expectPass(schema, "2021-01-15T14:30:00+00:00");
            assert(resultZ instanceof Temporal.Instant);
            assert(resultOffset instanceof Temporal.Instant);
            assert(resultZ.equals(resultOffset));
        });
        it("should pass through an existing Instant instance", () => {
            const schema = custom.instant();
            const input = Temporal.Instant.from("2021-01-15T14:30:00Z");
            const result = expectPass(schema, input);
            assert(result instanceof Temporal.Instant);
            assert(result.equals(input));
        });
        it("should reject an invalid string", () => {
            const schema = custom.instant();
            expectError(schema, "foo", "temporal.instant.base");
        });
        it("should reject a string without offset", () => {
            const schema = custom.instant();
            expectError(schema, "2021-01-15T14:30:00", "temporal.instant.base");
        });
        it("should reject a date-only string", () => {
            const schema = custom.instant();
            expectError(schema, "2021-01-15", "temporal.instant.base");
        });
        it("should reject a number", () => {
            const schema = custom.instant();
            expectError(schema, 42, "temporal.instant.base");
        });
        it("should reject an empty string", () => {
            const schema = custom.instant();
            expectError(schema, "", "temporal.instant.base");
        });
        it("should respect .required()", () => {
            const schema = custom.instant().required();
            expectError(schema, undefined, "any.required");
        });
        it("should respect .optional()", () => {
            const schema = custom.instant().optional();
            const result = expectPass(schema, undefined);
            assert.equal(result, undefined);
        });
    });
    // ── Comparison rules ──────────────────────────────────────
    describe("min", () => {
        it("should pass when value equals the min boundary", () => {
            const schema = custom.instant().min("2021-01-01T00:00:00Z");
            expectPass(schema, "2021-01-01T00:00:00Z");
        });
        it("should pass when value is after the min boundary", () => {
            const schema = custom.instant().min("2021-01-01T00:00:00Z");
            expectPass(schema, "2021-06-15T12:00:00Z");
        });
        it("should fail when value is before the min boundary", () => {
            const schema = custom.instant().min("2021-01-01T00:00:00Z");
            expectError(schema, "2020-12-31T23:59:59Z", "temporal.instant.min");
        });
        it("should accept an Instant instance as the limit", () => {
            const limit = Temporal.Instant.from("2021-01-01T00:00:00Z");
            const schema = custom.instant().min(limit);
            expectPass(schema, "2021-06-15T12:00:00Z");
            expectError(schema, "2020-06-15T12:00:00Z", "temporal.instant.min");
        });
    });
    describe("max", () => {
        it("should pass when value equals the max boundary", () => {
            const schema = custom.instant().max("2025-12-31T23:59:59Z");
            expectPass(schema, "2025-12-31T23:59:59Z");
        });
        it("should fail when value is after the max boundary", () => {
            const schema = custom.instant().max("2025-12-31T23:59:59Z");
            expectError(schema, "2026-01-01T00:00:00Z", "temporal.instant.max");
        });
    });
    describe("gt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.instant().gt("2021-01-01T00:00:00Z");
            expectError(schema, "2021-01-01T00:00:00Z", "temporal.instant.gt");
        });
        it("should pass when value is after the boundary", () => {
            const schema = custom.instant().gt("2021-01-01T00:00:00Z");
            expectPass(schema, "2021-01-01T00:00:01Z");
        });
    });
    describe("lt", () => {
        it("should fail when value equals the boundary (strict)", () => {
            const schema = custom.instant().lt("2025-12-31T23:59:59Z");
            expectError(schema, "2025-12-31T23:59:59Z", "temporal.instant.lt");
        });
        it("should pass when value is before the boundary", () => {
            const schema = custom.instant().lt("2025-12-31T23:59:59Z");
            expectPass(schema, "2025-12-31T23:59:58Z");
        });
    });
    describe("chained rules", () => {
        it("should enforce both min and max", () => {
            const schema = custom
                .instant()
                .min("2021-01-01T00:00:00Z")
                .max("2025-12-31T23:59:59Z");
            expectPass(schema, "2023-06-15T12:00:00Z");
            expectError(schema, "2020-01-01T00:00:00Z", "temporal.instant.min");
            expectError(schema, "2026-06-15T12:00:00Z", "temporal.instant.max");
        });
    });
    // ── Joi integration ───────────────────────────────────────
    describe("joi integration", () => {
        it("should work inside Joi.object()", () => {
            const schema = custom.object({
                createdAt: custom.instant().required(),
            });
            const { error, value } = schema.validate({ createdAt: "2021-01-15T14:30:00Z" });
            assert.equal(error, undefined);
            assert(value.createdAt instanceof Temporal.Instant);
        });
        it("should support .describe()", () => {
            const schema = custom.instant().min("2021-01-01T00:00:00Z");
            const description = schema.describe();
            assert.equal(description.type, "instant");
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    describe("edge cases", () => {
        it("should handle epoch zero", () => {
            const schema = custom.instant();
            const result = expectPass(schema, "1970-01-01T00:00:00Z");
            assert(result instanceof Temporal.Instant);
            assert.equal(result.epochNanoseconds, 0n);
        });
        it("should handle negative offsets", () => {
            const schema = custom.instant();
            const result = expectPass(schema, "2021-01-15T14:30:00-05:00");
            assert(result instanceof Temporal.Instant);
        });
    });
});

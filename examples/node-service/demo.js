/**
 * joi-temporal demo — run without a server to see validation in action.
 *
 *   node --import temporal-polyfill/global demo.js
 */
import Joi from "joi";
import joiTemporal from "@bjnewman/joi-temporal";

const custom = Joi.extend(...joiTemporal);

// ── Booking schema ──────────────────────────────────────────

const bookingSchema = custom.object({
    date: custom.plainDate().min("now").max("2026-12-31").required(),
    startTime: custom.plainTime().min("09:00").max("17:00").required(),
    duration: custom.duration().positive().min("PT30M").max("PT4H").required(),
    timezone: custom.zonedDateTime().timezone("America/New_York").optional(),
});

// ── Valid payload ───────────────────────────────────────────

const valid = {
    date: "2026-06-15",
    startTime: "10:00",
    duration: "PT1H30M",
};

const result = bookingSchema.validate(valid);
console.log("── Valid payload ──");
console.log("  date:", result.value.date.toString(), `(${result.value.date.constructor.name})`);
console.log("  startTime:", result.value.startTime.toString(), `(${result.value.startTime.constructor.name})`);
console.log("  duration:", result.value.duration.toString(), `(${result.value.duration.constructor.name})`);
console.log("  end time:", result.value.startTime.add(result.value.duration).toString());
console.log();

// ── Invalid payloads ────────────────────────────────────────

const pastDate = { date: "2020-01-01", startTime: "10:00", duration: "PT1H" };
const pastResult = bookingSchema.validate(pastDate);
console.log("── Past date ──");
console.log("  error:", pastResult.error.details[0].message);
console.log();

const lateTime = { date: "2026-06-15", startTime: "22:00", duration: "PT1H" };
const lateResult = bookingSchema.validate(lateTime);
console.log("── Late time ──");
console.log("  error:", lateResult.error.details[0].message);
console.log();

const longDuration = { date: "2026-06-15", startTime: "10:00", duration: "PT12H" };
const longResult = bookingSchema.validate(longDuration);
console.log("── Long duration ──");
console.log("  error:", longResult.error.details[0].message);
console.log();

const zeroDuration = { date: "2026-06-15", startTime: "10:00", duration: "PT0S" };
const zeroResult = bookingSchema.validate(zeroDuration);
console.log("── Zero duration ──");
console.log("  error:", zeroResult.error.details[0].message);
console.log();

// ── describe() introspection ────────────────────────────────

console.log("── Schema introspection ──");
const dateSchema = custom.plainDate().min("2024-01-01").max("2026-12-31");
console.log("  describe():", JSON.stringify(dateSchema.describe(), null, 2));

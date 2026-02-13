import Joi from "joi";
import joiTemporal from "@bjn/joi-temporal";

const custom = Joi.extend(...joiTemporal);

export const bookingSchema = custom.object({
    startDate: custom
        .plainDate()
        .min("now")
        .required()
        .messages({
            "temporal.plainDate.base": "{{#label}} must be a valid date",
            "temporal.plainDate.min": "{{#label}} must be today or later",
            "any.required": "{{#label}} is required",
        }),
    endDate: custom
        .plainDate()
        .min("now")
        .required()
        .messages({
            "temporal.plainDate.base": "{{#label}} must be a valid date",
            "temporal.plainDate.min": "{{#label}} must be today or later",
            "any.required": "{{#label}} is required",
        }),
    meetingTime: custom
        .plainTime()
        .min("08:00")
        .max("18:00")
        .required()
        .messages({
            "temporal.plainTime.base": "{{#label}} must be a valid time",
            "temporal.plainTime.min": "{{#label}} must be between 8am and 6pm",
            "temporal.plainTime.max": "{{#label}} must be between 8am and 6pm",
            "any.required": "{{#label}} is required",
        }),
    duration: custom
        .duration()
        .positive()
        .min("PT15M")
        .max("PT4H")
        .required()
        .messages({
            "temporal.duration.base": "{{#label}} must be a valid duration (e.g. PT1H, PT30M)",
            "temporal.duration.positive": "{{#label}} must be a positive duration",
            "temporal.duration.min": "{{#label}} must be at least 15 minutes",
            "temporal.duration.max": "{{#label}} must be at most 4 hours",
            "any.required": "{{#label}} is required",
        }),
});

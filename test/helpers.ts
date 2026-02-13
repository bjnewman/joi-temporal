import Joi from "joi";
import joiTemporal from "../src/index.js";

export const custom = Joi.extend(...joiTemporal);

export function validate(schema: Joi.Schema, value: unknown) {
    return schema.validate(value);
}

export function expectPass(schema: Joi.Schema, value: unknown) {
    const { error, value: result } = schema.validate(value);
    if (error) {
        throw new Error(`Expected validation to pass but got: ${error.message}`);
    }
    return result;
}

export function expectError(schema: Joi.Schema, value: unknown, code?: string) {
    const { error } = schema.validate(value);
    if (!error) {
        throw new Error(`Expected validation to fail but it passed`);
    }
    if (code && error.details[0].type !== code) {
        throw new Error(
            `Expected error code "${code}" but got "${error.details[0].type}": ${error.message}`,
        );
    }
    return error;
}

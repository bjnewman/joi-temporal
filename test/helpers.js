import Joi from "joi";
import joiTemporal from "../src/index.js";
export const custom = Joi.extend(...joiTemporal);
export function validate(schema, value) {
    return schema.validate(value);
}
export function expectPass(schema, value) {
    const { error, value: result } = schema.validate(value);
    if (error) {
        throw new Error(`Expected validation to pass but got: ${error.message}`);
    }
    return result;
}
export function expectError(schema, value, code) {
    const { error } = schema.validate(value);
    if (!error) {
        throw new Error(`Expected validation to fail but it passed`);
    }
    if (code && error.details[0].type !== code) {
        throw new Error(`Expected error code "${code}" but got "${error.details[0].type}": ${error.message}`);
    }
    return error;
}

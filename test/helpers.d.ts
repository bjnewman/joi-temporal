import Joi from "joi";
export declare const custom: any;
export declare function validate(schema: Joi.Schema, value: unknown): Joi.ValidationResult<any>;
export declare function expectPass(schema: Joi.Schema, value: unknown): any;
export declare function expectError(schema: Joi.Schema, value: unknown, code?: string): Joi.ValidationError;

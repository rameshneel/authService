import Joi from "joi";

export const signupSchemas = {
  customer: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    fullName: Joi.string().required(),
    type: Joi.string().valid("customer").required(),
  }),
  vendor: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().required(),
    companyName: Joi.string().required(),
    type: Joi.string().valid("vendor").required(),
    country: Joi.string().required(),
  }),
  company: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().required(),
    type: Joi.string().valid("company").required(),
  }),
};

export const commonLoginSchema = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    type: Joi.string().valid("customer", "vendor", "company").required(),
  });

  return schema.validate(data, { abortEarly: false });
};

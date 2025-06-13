import Joi from "joi";

export const signupSchemas = {
  customer: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    type: Joi.string().valid("customer").required(),
  }),
  vendor: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    designation: Joi.string().required(),
    companyName: Joi.string().required(),
    type: Joi.string().valid("vendor").required(),
    country: Joi.string().required(),
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

export const createProfileSchemas = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("admin", "manager", "salesPerson").required(),
    password: Joi.string().allow("", null),
  });

  return schema.validate(data, { abortEarly: false });
};

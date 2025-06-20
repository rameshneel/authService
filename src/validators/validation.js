import Joi from "joi";

export const signupSchemas = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    type: Joi.string().valid("customer", "vendor", "company").required(),
    role: Joi.string()
      .valid("admin", "manager", "salesPerson")
      .allow("", null)
      .default(null),
  });

  return schema.validate(data, { abortEarly: false });
};

export const commonLoginSchema = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    type: Joi.string().valid("customer", "vendor", "company").required(),
  });

  return schema.validate(data, { abortEarly: false });
};

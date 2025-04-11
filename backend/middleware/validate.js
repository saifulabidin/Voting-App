const Joi = require('joi');

const schemas = {
  createPoll: Joi.object({
    title: Joi.string().min(3).required(),
    options: Joi.array().min(2).items(
      Joi.object({
        option: Joi.string().min(1).required()
      })
    ).required()
  }),
  
  vote: Joi.object({
    optionId: Joi.string().required()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schemas[schema].validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};

module.exports = { validate, schemas };
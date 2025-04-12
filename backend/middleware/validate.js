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

const validateCreatePoll = (req, res, next) => {
  const { title, options } = req.body;

  const errors = [];

  if (!title?.trim()) {
    errors.push('Title is required');
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!Array.isArray(options)) {
    errors.push('Options must be an array');
  } else if (options.length < 2) {
    errors.push('At least 2 options are required');
  } else {
    const validOptions = options.filter(opt => opt && opt.option?.trim());
    if (validOptions.length < 2) {
      errors.push('At least 2 valid options are required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: errors
    });
  }

  next();
};

module.exports = { validate, schemas, createPoll: validateCreatePoll };
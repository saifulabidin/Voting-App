const { body, param, validationResult } = require('express-validator');

const schemas = {
  createPoll: [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
    body('options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
    body('options.*.option').trim().notEmpty().withMessage('Option text cannot be empty')
  ],
  vote: [
    param('pollId').isMongoId().withMessage('Invalid poll ID'),
    body('optionId').isMongoId().withMessage('Invalid option ID')
  ],
  addOption: [
    param('pollId').isMongoId().withMessage('Invalid poll ID'),
    body('option').trim().notEmpty().withMessage('Option text is required')
  ]
};

const validate = (schema) => {
  return async (req, res, next) => {
    await Promise.all(schemas[schema].map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
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
    errors.push('Title must be at least 3 characters long');
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
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = { validate, schemas, validateCreatePoll };
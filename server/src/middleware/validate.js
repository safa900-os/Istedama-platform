const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains and short-circuits with a 400
 * if any validation rule failed, keeping controllers free of boilerplate.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: errors.array().map((e) => `${e.path}: ${e.msg}`)
    });
  }
  next();
}

module.exports = validate;

const jsonschema = require('jsonschema');

function JSONValidator(instance, schema) {
  return jsonschema.validate(instance, schema);
}

module.exports = JSONValidator;
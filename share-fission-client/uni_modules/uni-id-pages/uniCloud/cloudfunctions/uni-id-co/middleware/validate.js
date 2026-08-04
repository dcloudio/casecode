module.exports = function (value = {}, schema = {}) {
  const validateRes = this.validator.validate(value, schema)
  if (validateRes) {
    delete validateRes.schemaKey
    throw validateRes
  }
}

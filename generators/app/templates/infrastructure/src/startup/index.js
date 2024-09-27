<%_ if(addTracing) {_%>
const tracer = require("./tracing") // should be imported first to patch other modules
<%_}_%>
const { getDataSources } = require("./dataSources");
const schema = require("./schema");
const logger = require("./logger");

module.exports = {
  schema,
  getDataSources,
  <%_ if(addTracing) {_%>
  tracer,
  <%_}_%>
  logger
};

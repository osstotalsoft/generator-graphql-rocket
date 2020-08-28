<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./tenantIdentification");
<%_}_%>
const contextDbInstance = require("./db/contextDbInstance");
const correlationMiddleware = require("./correlation/correlationMiddleware")
const validateToken = require("./auth/auth");
<%_ if(addTracing){ _%>
const tracingMiddleware = require('./tracing/tracingMiddleware');
<%_}_%>
const errorHandlingMiddleware = require('./errorHandling/errorHandlingMiddleware');

module.exports = {
  ...validateToken,
  contextDbInstance,
  <%_ if(withMultiTenancy){ _%>
  tenantIdentification,
  <%_}_%>
  correlationMiddleware,
  <%_ if(addTracing){ _%>
  tracingMiddleware,
  <%_}_%>
  errorHandlingMiddleware
};

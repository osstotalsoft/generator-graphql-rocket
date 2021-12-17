<%_ if(dataLayer == "knex") {_%>
  <%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./tenantIdentification");
  <%_}_%>
const contextDbInstance = require("./db/contextDbInstance");
<%_}_%>
const correlationMiddleware = require("./correlation/correlationMiddleware")
const validateToken = require("./auth/auth");
<%_ if(addTracing){ _%>
const tracingMiddleware = require('./tracing/tracingMiddleware');
<%_}_%>
const errorHandlingMiddleware = require('./errorHandling/errorHandlingMiddleware');

module.exports = {
  ...validateToken,
  <%_ if(dataLayer == "knex") {_%>
  contextDbInstance,
    <%_ if(withMultiTenancy){ _%>
  tenantIdentification,
    <%_}_%>
  <%_}_%>
  correlationMiddleware,
  <%_ if(addTracing){ _%>
  tracingMiddleware,
  <%_}_%>
  errorHandlingMiddleware
};

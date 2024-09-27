const correlationMiddleware = require("./correlation/correlationMiddleware")
const validateToken = require("./auth/auth");
const errorHandlingMiddleware = require('./errorHandling/errorHandlingMiddleware');
<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./tenantIdentification");
<%_}_%>
<%_ if(addTracing){ _%>
const tracingMiddleware = require('./tracing/tracingMiddleware');
<%_}_%>
const loggingMiddleware = require('./logger/loggingMiddleware')
<%_ if(withRights){ _%>
const permissionsMiddleware = require('./permissions')
<%_}_%>


module.exports = {
  ...validateToken,
  <%_ if(withRights){ _%>
  ...permissionsMiddleware,
  <%_}_%>
  <%_ if(withMultiTenancy){ _%>
  tenantIdentification,
  <%_}_%>
  correlationMiddleware,
  <%_ if(addTracing){ _%>
  tracingMiddleware,
  <%_}_%>
  errorHandlingMiddleware,
  loggingMiddleware
};

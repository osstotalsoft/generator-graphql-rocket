const { correlationManager } = require("@totalsoft/correlation");
const { trace } = require("@opentelemetry/api");
const attributeNames = require("../../constants/tracingAttributes");
<%_ if(withMultiTenancy) {_%>
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
<%_}_%>

const tracingMiddleWare = () => async (ctx, next) => {
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute(attributeNames.correlationId, correlationManager.getCorrelationId());
  <%_ if(withMultiTenancy) {_%>
  activeSpan?.setAttribute(attributeNames.tenantId, tenantContextAccessor.getTenantContext()?.tenant?.id);
  <%_}_%>

  await next();
}

module.exports = tracingMiddleWare;

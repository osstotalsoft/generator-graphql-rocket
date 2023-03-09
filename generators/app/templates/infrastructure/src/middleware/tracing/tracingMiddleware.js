const { correlationManager } = require("@totalsoft/correlation");
const { trace } = require("@opentelemetry/api");
const attributeNames = require("../../constants/tracingAttributes");
const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");

const tracingMiddleWare = () => async (ctx, next) => {
  const activeSpan = trace.getActiveSpan();
  activeSpan?.setAttribute(attributeNames.correlationId, correlationManager.getCorrelationId());
  activeSpan?.setAttribute(attributeNames.tenantId, tenantContextAccessor.getTenantContext()?.tenant?.id);

  await next();
}

module.exports = tracingMiddleWare;

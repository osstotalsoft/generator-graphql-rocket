
const { envelope } = require("@totalsoft/message-bus")
const { tenantService, tenantContextAccessor } = require("@totalsoft/multitenancy-core");
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')

const tenantIdentification = () => async (ctx, next) => {
  const tenant = isMultiTenant ? await tenantService.getTenantFromId(getTenantIdFromMessage(ctx.received.msg)) : {};

  await tenantContextAccessor.useTenantContext({ tenant }, next);
}

function getTenantIdFromMessage(msg) {
    const tenantId = envelope.getTenantId(msg) || msg.headers.tid
    return tenantId
}

module.exports = tenantIdentification

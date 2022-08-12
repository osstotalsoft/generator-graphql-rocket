
const { envelope } = require("@totalsoft/message-bus")
const { tenantService } = require("@totalsoft/tenant-configuration");
<%_ if(dataLayer == "prisma") { _%>
const { useTenantContext } = require("../../../multiTenancy")
<%_ } _%>
<%_ if(withMultiTenancy){ _%>
  const { tenantContextAccessor } = require("../../../multiTenancy");
  const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')
<%_}_%>

const tenantIdentification = () => async (ctx, next) => {
  const tenant = isMultiTenant ? await tenantService.getTenantFromId(getTenantIdFromMessage(ctx.received.msg)) : {};

  await tenantContextAccessor.useTenantContext({ tenant }, next);
}

function getTenantIdFromMessage(msg) {
    const tenantId = envelope.getTenantId(msg) || msg.headers.tid
    return tenantId
}

module.exports = tenantIdentification

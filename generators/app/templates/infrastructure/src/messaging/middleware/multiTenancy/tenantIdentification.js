
const { envelope } = require("@totalsoft/message-bus")
const { tenantService } = require("@totalsoft/tenant-configuration");
<%if(dataLayer == "prisma") {%>
const { useTenantContext } = require("../../../multiTenancy")
<% } %>

const tenantIdentification = () => async (ctx, next) => {
    if (!isMultiTenant) {
      ctx.tenant = {};
      await next();
      return;
    }
    const tenantId = getTenantIdFromMessage(ctx.received.msg);
    const tenant = await tenantService.getTenantFromId(tenantId);

    if (tenant) {
        ctx.tenant = tenant;

        <%_ if(dataLayer == "prisma") {_%>
        await useTenantContext(tenant, async () => {
            await next()
        })
        <%_} else { _%>
        await next();
        <%_}_%>
    }
    else {
        throw new Error(`Could not identify tenant!`)
    }
}

function getTenantIdFromMessage(msg) {
    const tenantId = envelope.getTenantId(msg) || msg.headers.tid
    return tenantId
}

module.exports = tenantIdentification

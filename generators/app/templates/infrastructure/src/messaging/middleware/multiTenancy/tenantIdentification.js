
const { tenantFactory <%if(dataLayer == "prisma") {%>, useTenantContext<% } %>  } = require("../../../multiTenancy")
const { envelope } = require("@totalsoft/message-bus")

const tenantIdentification = () => async (ctx, next) => {
    const externalTenantId = getTenantIdFromMessage(ctx.received.msg)
    const tenant = await tenantFactory.getTenantFromId(tenantId)
    if (tenant) {
        ctx.tenantId = tenant?.id
        ctx.externalTenantId = externalTenantId

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
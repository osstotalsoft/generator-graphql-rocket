
const { tenantService } = require("../../../multiTenancy")
const { envelope } = require("@totalsoft/message-bus")

const tenantIdentification = () => async (ctx, next) => {
    const tenantId = getTenantIdFromMessage(ctx.received.msg)
    const tenant = await tenantService.getTenantFromId(tenantId)
    if (tenant) {
        ctx.tenant = tenant
        await next();
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
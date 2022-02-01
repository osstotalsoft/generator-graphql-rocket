<%_if(addQuickStart){ _%>
const tenantModule = require("./tenantModule");
<%_}_%>

async function getTenantFromId(tenantId) {
    if (!tenantId) {
        return null;
    }
    // Get your tenant details here by calling a service, module, data source, or something else
<%_if(addQuickStart){ _%>
    const tenant = await tenantModule.getTenantFromId(tenantId)
    return tenant
<%_} else { _%>
    return null // your tenant data here
<%_}_%>
}

module.exports = { getTenantFromId };
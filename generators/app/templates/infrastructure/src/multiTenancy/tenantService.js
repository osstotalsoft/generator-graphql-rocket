
const tenantModule = require("./tenantModule");

async function getTenantFromId(tenantId) {
    if (!tenantId) {
        return null;
    }
    const tenant = await tenantModule.getTenantFromId(tenantId);
    return tenant
}

module.exports = { getTenantFromId };
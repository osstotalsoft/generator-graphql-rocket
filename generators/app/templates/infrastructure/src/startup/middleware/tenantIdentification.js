const { useTenantContext } = require('../../multiTenancy')
const { tenantConfiguration, tenantService } = require('@totalsoft/tenant-configuration')
const cacheMap = new Map()

const tenantIdentification = async (resolve, root, args, context, info) => {
  const tenantId = context?.tenantId
  let tenantManager = {}
  if (cacheMap.has(tenantId)) tenantManager = cacheMap.get(tenantId)
  else{
    const tenant = await tenantService.getTenantFromId(tenantId)
    const connectionInfo = await tenantConfiguration.getConnectionInfo(tenantId, '<%= dbConnectionName %>')
    if (tenant) {
      tenantManager = { ...tenant, connectionInfo }
      cacheMap.set(tenantId, tenantManager)
    } else {
      throw new Error(`Could not identify tenant!`)
    }
  }
  return await useTenantContext(tenantManager, async () => {
    return await resolve(root, args, context, info)
  })
}

module.exports = { tenantIdentification }

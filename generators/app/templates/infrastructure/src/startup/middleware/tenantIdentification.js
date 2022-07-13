const { useTenantContext } = require('../../multiTenancy')
const { tenantConfiguration, tenantService } = require('@totalsoft/tenant-configuration')
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT)

const cacheMap = new Map()

const tenantIdentification = async (resolve, root, args, context, info) => {
  if (!isMultiTenant) return await resolve(root, args, context, info)

  const tenantId = context?.tenant?.id
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

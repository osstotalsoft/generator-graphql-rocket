const { tenantFactory, tenantConfiguration, useTenantContext } = require('../../multiTenancy')
const cacheMap = new Map()

const tenantIdentification = async (resolve, root, args, context, info) => {
  const tenantId = context?.tenantId
  let tenantManager = {}
  if (cacheMap.has(tenantId)) tenantManager = cacheMap.get(tenantId)
  else{
    const tenant = await tenantFactory.getTenantFromId(tenantId)
    const dbConfig = await tenantConfiguration.getDataSourceInfo(tenantId)
    if (tenant) {
      tenantManager = { ...tenant, ...dbConfig }
      cacheMap.set(id, tenantManager)
    } else {
      throw new Error(`Could not identify tenant!`)
    }
  }
  return await useTenantContext(tenantManager, async () => {
    return await resolve(root, args, context, info)
  })
}

module.exports = { tenantIdentification }

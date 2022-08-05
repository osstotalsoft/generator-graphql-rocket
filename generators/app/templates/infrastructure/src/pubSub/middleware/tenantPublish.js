const { tenantContextAccessor } = require('../../multiTenancy')

const tenantPublish = async (ctx, next) => {
  const tenantContext = tenantContextAccessor.getTenantContext()
  ctx.message.headers.pubsubTenantId = tenantContext?.tenant?.id

  return await next()
}

module.exports = { tenantPublish }

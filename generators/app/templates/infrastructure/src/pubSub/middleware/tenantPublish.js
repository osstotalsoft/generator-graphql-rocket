const { tenantContextAccessor } = require('@totalsoft/multitenancy-core')

const tenantPublish = async (ctx, next) => {
  const tenantContext = tenantContextAccessor.getTenantContext()
  ctx.message.headers.pubSubTenantId = tenantContext?.tenant?.id

  return await next()
}

module.exports = { tenantPublish }

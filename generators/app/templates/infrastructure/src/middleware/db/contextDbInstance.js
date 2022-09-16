const { dbInstanceFactory } = require('../../db')
const { tenantContextAccessor } = require('@totalsoft/multitenancy-core')

const contextDbInstance = () => async (ctx, next) => {
  <%_ if(withMultiTenancy){ _%>
  const { tenant } = tenantContextAccessor.getTenantContext()
  if (tenant) {
    const dbInstance = await dbInstanceFactory(tenant.id, { logger: ctx.logger })
    ctx.dbInstance = dbInstance
  }
  <%_} else { _%>
    const dbInstance = await dbInstanceFactory({ logger: ctx.logger })
    ctx.dbInstance = dbInstance
  <%_}_%>

  await next()
}


module.exports = contextDbInstance


const { dbInstanceFactory } = require('../../db')
<%_ if(withMultiTenancy){ _%>
const { tenantContextAccessor } = require('@totalsoft/multitenancy-core')
<%_}_%>

const dbInstance = () => async (ctx, next) => {
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

module.exports = dbInstance

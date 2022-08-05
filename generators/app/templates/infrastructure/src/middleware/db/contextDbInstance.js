const { dbInstanceFactory } = require('../../db');
const { tenantContextAccessor } = require("../../multiTenancy");

const contextDbInstance = () => async (ctx, next) => {
  <%_ if(withMultiTenancy){ _%>
  const { tenant } = tenantContextAccessor.getTenantContext();
  if (tenant) {
    const dbInstance = await dbInstanceFactory(tenant.id)
    ctx.dbInstance = dbInstance
  }
  <%_} else { _%>
    const dbInstance = await dbInstanceFactory()
    ctx.dbInstance = dbInstance
  <%_}_%>

  await next()
}


module.exports = contextDbInstance

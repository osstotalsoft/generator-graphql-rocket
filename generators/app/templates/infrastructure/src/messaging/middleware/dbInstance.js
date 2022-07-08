<%_ if(withMultiTenancy){ _%>
  const { tenantDbInstanceFactory } = require("../../db/multiTenancy/tenantDbInstanceFactory");
  <%_} else { _%>
  const { dbInstanceFactory } = require("../../db");
  <%_}_%>

  const dbInstance = () => async (ctx, next) => {
    <%_ if(withMultiTenancy){ _%>
    const { tenant } = ctx
    if (tenant) {
      const dbInstance = await tenantDbInstanceFactory(tenant.id)
      ctx.dbInstance = dbInstance
    }
    <%_} else { _%>
      const dbInstance = await dbInstanceFactory()
      ctx.dbInstance = dbInstance
    <%_}_%>

    await next();
  };


  module.exports = dbInstance

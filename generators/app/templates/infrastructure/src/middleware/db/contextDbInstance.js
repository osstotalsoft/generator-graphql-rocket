const { dbInstanceFactory } = require("../../db");

const contextDbInstance = () => async (ctx, next) => {
  <%_ if(withMultiTenancy){ _%>
  const { tenantId } = ctx
  if (tenantId) {
    const dbInstance = await dbInstanceFactory(tenantId)
    ctx.dbInstance = dbInstance
  }
  <%_} else { _%>
    const dbInstance = await dbInstanceFactory()
    ctx.dbInstance = dbInstance
  <%_}_%>

  await next();
};


module.exports = contextDbInstance
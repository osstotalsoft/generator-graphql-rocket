const { tenantContextAccessor } = require("@totalsoft/multitenancy-core");
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT);

const tenantContext = async (ctx, next) => {
  if (!isMultiTenant) {
    return await next();
  }

  const tenant = ctx.context?.tenant;
  if (!tenant?.id) {
    throw new Error(`Tenant not configured on ws connect!`);
  }

  const tenantContext = { tenant };

  return await tenantContextAccessor.useTenantContext(tenantContext, next);
};

module.exports = { tenantContext };

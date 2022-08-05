
const jsonwebtoken = require('jsonwebtoken')
const { tenantService } = require('@totalsoft/tenant-configuration')
const { tenantContextAccessor } = require("../../multiTenancy");

const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')

const tenantIdentification = () => async (ctx, next) => {
  const tenant = isMultiTenant ? await tenantService.getTenantFromId(getTenantIdFromJwt(ctx)) : {};

  await tenantContextAccessor.useTenantContext({ tenant }, next);
}

const getTenantIdFromJwt = ({ token }) => {
  let tenantId = null
  if (token) {
    const decoded = jsonwebtoken.decode(token.replace('Bearer ', ''))
    if (decoded) {
        tenantId = decoded.tid
    }
  }
  return tenantId
}

// eslint-disable-next-line no-unused-vars
const getTenantIdFromQueryString = ({ request }) => request.query.tenantId

// eslint-disable-next-line no-unused-vars
const getTenantIdFromHeaders = ctx => ctx.req.headers.tenantid

// eslint-disable-next-line no-unused-vars
const getTenantIdFromHost = ctx => ctx.hostname

// eslint-disable-next-line no-unused-vars
const getTenantIdFromRefererHost = async ctx => {
  if (!ctx.request.headers.referer) {
    return
  }
  var url = new URL.parse(ctx.request.headers.referer)
  return url.hostname
}

module.exports = tenantIdentification


const jsonwebtoken = require('jsonwebtoken');
const { tenantFactory } = require("../../multiTenancy")

const tenantIdentification = () => async (ctx, next) => {
    const externalTenantId = getTenantIdFromJwt(ctx)
    const tenant = await tenantFactory.getTenantFromId(externalTenantId)
    if (tenant) {
      ctx.tenantId = tenant?.id
      ctx.externalTenantId = externalTenantId
    } else {
      throw new Error(`Could not identify tenant!`)
    }
    await next();
}

const getTenantIdFromJwt = ({ token }) => {
    let tenantId = null;
    if (token) {
        const decoded = jsonwebtoken.decode(token.replace("Bearer ", ""));
        if (decoded) {
            tenantId = decoded.tid;
        }
    }
    return tenantId;
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
        return;
    }
    var url = new URL.parse(ctx.request.headers.referer);
    return url.hostname
};

module.exports = tenantIdentification;

const jwt = require("koa-jwt");
const jwksRsa = require("jwks-rsa");
const jsonwebtoken = require('jsonwebtoken');
<%_ if(addSubscriptions){ _%>
const { CloseCode } = require("graphql-ws");
<%_}_%>
const { IDENTITY_AUTHORITY, IDENTITY_OPENID_CONFIGURATION } = process.env;

const client = {
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 2,
  jwksUri: `${IDENTITY_AUTHORITY}${IDENTITY_OPENID_CONFIGURATION}`
}

const jwtTokenValidation = (ctx, next) => {
  const validateJwtToken = jwt({
    secret: jwksRsa.koaJwtSecret(client),
    issuer: IDENTITY_AUTHORITY,
    algorithms: ["RS256"],
    key: 'jwtdata',
    tokenKey: 'token',
  });
  return validateJwtToken(ctx, next);
}

const jwtTokenUserIdentification = async (ctx, next) => {

  const { jwtdata, token } = ctx?.state ?? {}
  ctx.token = token
  ctx.externalUser = jwtdata ? { id: jwtdata.sub, role: jwtdata.role } : {}

  await next();
}

const validateToken = async (token) => {
  const decoded = jsonwebtoken.decode(token, { complete: true });

  const Promise = require("bluebird");
  const getKey = Promise.promisify(jwksRsa(client).getSigningKey);
  const key = await getKey(decoded.header.kid);

  return jsonwebtoken.verify(token, key.getPublicKey());
}

<% if(addSubscriptions){ %>
const validateWsToken = async (token, socket) => {
  try {
    await validateToken(token);
  } catch {
    return socket?.close(CloseCode.Forbidden, "Forbidden! Jwt token is not valid!");
  }
}
<%}%>

module.exports = { jwtTokenValidation, jwtTokenUserIdentification, validateToken<% if(addSubscriptions){ %>, validateWsToken<%}%> }

const { correlationManager } = require("@totalsoft/correlation");
const NoCacheRESTDataSource = require("./noCacheRESTDataSource");
const { <% if(withMultiTenancy){ %>TenantId,<%}%> UserId, UserPassport } = require("../constants/customHttpHeaders");
const { assoc } = require('ramda')

class ApiRESTDataSource extends NoCacheRESTDataSource {

  willSendRequest(request) {
    const { jwtdata } = this.context.state ?? {}
    <%_ if(withMultiTenancy){ _%>
    request.headers = assoc(TenantId, jwtdata?.tid, request.headers)
    <%_}_%>
    request.headers = assoc(UserPassport, jwtdata ? JSON.stringify(jwtdata) : undefined, request.headers)
    request.headers = assoc(UserId, jwtdata?.sub, request.headers)

    //TODO to be removed
    if (this.context.token) {
      request.headers.Authorization = `Bearer ${this.context.token}`
    }

    const acceptLanguage = this.context.request?.headers?.["accept-language"]
    if (acceptLanguage)
      request.headers['Accept-Language'] = acceptLanguage

    const correlationId = correlationManager.getCorrelationId();
    if (correlationId) request.headers['x-correlation-id'] = correlationId
      request.headers['content-type'] = 'application/json'
  }
}

module.exports = ApiRESTDataSource;

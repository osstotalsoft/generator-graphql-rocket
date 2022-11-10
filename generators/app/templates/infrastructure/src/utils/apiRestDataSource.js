const { correlationManager } = require("@totalsoft/correlation");
const NoCacheRESTDataSource = require("./noCacheRESTDataSource");
const { <% if(withMultiTenancy){ %>TenantId,<%}%> UserId, UserPassport } = require("../constants/customHttpHeaders");

class ApiRESTDataSource extends NoCacheRESTDataSource {

  willSendRequest(request) {
    const { jwtdata } = this.context.state ?? {}
    <%_ if(withMultiTenancy){ _%>
    request.headers.set(TenantId, jwtdata?.tid);
    <%_}_%>
    request.headers.set(UserPassport, jwtdata ? JSON.stringify(jwtdata) : undefined);
    request.headers.set(UserId, jwtdata?.sub);

    //TODO to be removed
    if (this.context.token) {
      request.headers.set("Authorization", `Bearer ${this.context.token}`);
    }

    const acceptLanguage = this.context.request?.headers?.["accept-language"]
    if (acceptLanguage)
      request.headers.set("Accept-Language", acceptLanguage);

    const correlationId = correlationManager.getCorrelationId();
    if (correlationId)
      request.headers.set("x-correlation-id", correlationId);
  }
}

module.exports = ApiRESTDataSource;

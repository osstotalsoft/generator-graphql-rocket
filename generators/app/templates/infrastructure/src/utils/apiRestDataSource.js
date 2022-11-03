const { correlationManager } = require("@totalsoft/correlation");
const NoCacheRESTDataSource = require("./noCacheRESTDataSource");
const { TenantId, UserId, UserPassport } = require("../constants/customHttpHeaders");

class ApiRESTDataSource extends NoCacheRESTDataSource {

  willSendRequest(request) {
    <%_ if(withMultiTenancy){ _%>
    request.headers.set(TenantId, this.context.state?.jwtdata?.tid ?? "");
    <%_}_%}
    request.headers.set(UserPassport, this.context.state?.jwtdata ? JSON.stringify(this.context.state.jwtdata) : "");
    request.headers.set(UserId, this.context.state?.jwtdata?.sub ?? "");

    //TODO to be removed
    if (this.context.token) {
      request.headers.set("Authorization", `Bearer ${this.context.token}`);
    }

    if (this.context.request?.headers?.["accept-language"])
      request.headers.set("Accept-Language", this.context.request.headers["accept-language"]);

    const correlationId = correlationManager.getCorrelationId();
    if (correlationId)
      request.headers.set("x-correlation-id", correlationId);
  }
}

module.exports = ApiRESTDataSource;

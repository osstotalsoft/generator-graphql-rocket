<%_ if(addTracing){ _%>
  const { OpenTracingRESTDataSource } = require("../tracing/openTracingRestDataSource");
<%_ } else { _%>
  const { RESTDataSource } = require('@apollo/datasource-rest')
<%_ } _%>

<%_ if(addTracing){ _%>
  class NoCacheRESTDataSource extends OpenTracingRESTDataSource {
<%_ } else { _%>
  class NoCacheRESTDataSource extends RESTDataSource {
<%_ } _%>

  deleteCacheForRequest(request) {
    this.memoizedResults.delete(this.cacheKeyFor(request))
  }

  didReceiveResponse(response, request) {
    this.deleteCacheForRequest(request)
    return super.didReceiveResponse(response, request)
  }

  didEncounterError(error, request) {
    this.deleteCacheForRequest(request)
    return super.didEncounterError(error, request)
  }
}

module.exports = { NoCacheRESTDataSource }

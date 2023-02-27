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

  cacheOptionsFor() {
    return {
      ttl: 0
    }
  }

  resolveURL(path) {
    if (path.startsWith('/')) {
      path = path.slice(1)
    }
    const baseURL = this.baseURL
    if (baseURL) {
      const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : baseURL.concat('/')
      return new URL(path, normalizedBaseURL)
    } else {
      return new URL(path)
    }
  }
}

module.exports = { NoCacheRESTDataSource }

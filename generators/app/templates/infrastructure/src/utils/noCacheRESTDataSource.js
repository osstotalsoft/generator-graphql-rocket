  const { RESTDataSource } = require('@apollo/datasource-rest')
  class NoCacheRESTDataSource extends RESTDataSource {

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

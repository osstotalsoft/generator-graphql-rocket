const { RESTDataSource } = require('apollo-datasource-rest')
const opentracing = require('opentracing')
const { getActiveSpan } = require('./spanManager')
// eslint-disable-next-line node/no-extraneous-require
const { Headers } = require('apollo-server-env')
const { traceError } = require('./tracingUtils')

class OpenTracingRESTDataSource extends RESTDataSource {
  constructor() {
    super()
  }

  async fetch(request) {
    const tracer = opentracing.globalTracer()
    const activeSpan = getActiveSpan()

    if (!(request.headers && request.headers instanceof Headers)) {
      request.headers = new Headers(request.headers || Object.create(null))
    }

    const networkSpan = tracer.startSpan(`REST ${request.method} ${request.path}`, {
      childOf: activeSpan
    })

    networkSpan.setTag(opentracing.Tags.SPAN_KIND, 'client')
    networkSpan.setTag(opentracing.Tags.HTTP_METHOD, request.method)
    networkSpan.setTag(opentracing.Tags.HTTP_URL, this.baseURL + request.path)

    let injectHeaders = {}
    tracer.inject(networkSpan, opentracing.FORMAT_HTTP_HEADERS, injectHeaders)
    for (const [key, value] of Object.entries(injectHeaders)) {
      request.headers.set(key, value)
    }

    try {
      return await super.fetch(request)
    } catch (error) {
      traceError(networkSpan, error)
      throw error
    } finally {
      networkSpan.finish()
    }
  }
}

module.exports = { OpenTracingRESTDataSource }

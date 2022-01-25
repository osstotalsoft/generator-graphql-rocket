const { FORMAT_HTTP_HEADERS } = require('opentracing')
const opentracing = require('opentracing')

const mapToObj = inputMap => {
  let obj = {}

  inputMap.forEach(function (value, key) {
    obj[key] = value
  })

  return obj
}

function getExternalSpan(tracer, request) {
  let headers
  let tmpHeaders = request && request.headers
  if (tmpHeaders && typeof tmpHeaders.get === 'function') {
    headers = mapToObj(tmpHeaders)
  } else {
    headers = tmpHeaders
  }

  return request && request.headers ? tracer.extract(FORMAT_HTTP_HEADERS, headers) : undefined
}

function _logError(activeSpan, error) {
  activeSpan.log({
    event: 'error',
    message: error.message,
    'error.object': error,
    'error.kind': typeof error,
    stack: error?.stack
  })
}

function _setErrorTags(activeSpan) {
  // Force the span to be collected for http errors
  activeSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1)
  // If error then set the span to error
  activeSpan.setTag(opentracing.Tags.ERROR, true)
}

function traceError(activeSpan, error) {
  if (!error) {
    return
  }

  _setErrorTags(activeSpan)
  _logError(activeSpan, error)
}

function traceErrors(activeSpan, errors) {
  if (!errors || !Array.isArray(errors)) {
    return
  }

  _setErrorTags(activeSpan)
  for (const error of errors) {
    _logError(activeSpan, error)
  }
}

module.exports = { getExternalSpan, traceError, traceErrors }

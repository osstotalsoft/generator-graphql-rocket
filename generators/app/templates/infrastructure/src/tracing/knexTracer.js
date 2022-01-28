const opentracing = require('opentracing')
const { getActiveSpan } = require('./spanManager')
const queryExecutor = require('knex/lib/execution/internal/query-executioner')

function createKnexTracer(knex) {
  const queries = new Map()
  const tracer = opentracing.globalTracer()

  return knex.on('query', handleQuery).on('query-error', handleQueryError).on('query-response', handleQueryResponse)

  function handleQuery({ __knexQueryUid: queryId, sql, method, bindings }) {
    const activeSpan = getActiveSpan()

    const span = tracer.startSpan('sqlClient ' + method, {
      childOf: activeSpan
    })

    const formattedSql = queryExecutor.formatQuery(sql, bindings)

    span.setTag(opentracing.Tags.SPAN_KIND, 'client')
    span.setTag(opentracing.Tags.DB_STATEMENT, formattedSql)
    span.setTag(opentracing.Tags.DB_INSTANCE, knex.client.config.connection.database)

    span.log({ event: 'query_start' })
    span.log({ event: 'sql_command', query: formattedSql })

    queries.set(queryId, span)
  }

  function handleQueryError(error, { __knexQueryUid: queryId }) {
    withQuery(queryId, span => {
      span.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1)
      span.setTag(opentracing.Tags.ERROR, true)
      span.log({ event: 'error', message: error })
      span.log({ event: 'query_end' })
      span.finish()
    })
  }

  function handleQueryResponse(_response, { __knexQueryUid: queryId }) {
    withQuery(queryId, span => {
      span.log({ event: 'query_end' })
      span.finish()
    })
  }

  function withQuery(queryId, fn) {
    const query = queries.get(queryId)
    queries.delete(queryId)
    if (!query) throw new TypeError('Query disappeared')
    const span = query
    fn(span)
  }
}

module.exports = createKnexTracer

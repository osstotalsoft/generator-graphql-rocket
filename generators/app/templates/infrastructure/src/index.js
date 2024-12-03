//env
process.chdir(`${__dirname}/..`)
const dotenv = require('dotenv')
const result = dotenv.config()
if (result.error) {
  console.warn('No .env file found in current working directory:', result.error)
  const path = `.env`
  const pathResult = dotenv.config({ path })
  if (pathResult.error) {
    console.warn('No .env file found in project root directory:', pathResult.error)
  }
}

if (process.env.NODE_ENV) {
  const nodeEnvResult = dotenv.config({ path: `./.env.${process.env.NODE_ENV}`, override: true })
  if (nodeEnvResult.error) {
    console.warn(`No .env.${process.env.NODE_ENV} file found in project root directory:`, nodeEnvResult.error)
  }
}

const keyPerFileEnv = require('@totalsoft/key-per-file-configuration')
const configMonitor = keyPerFileEnv.load()

require('console-stamp')(global.console, {
    format: ':date(yyyy/mm/dd HH:MM:ss.l)'
  })

const { logger<% if(addTracing) {%>, tracer<%}%> } = require("./startup"),
{ createServer } = require("http"),
{ startApolloServer<% if(addMessaging) { %>, startMsgHost <% } %> <% if(addSubscriptions){ %>, startSubscriptionServer <% } %>} = require('./servers')

// Metrics, diagnostics
const
  { DIAGNOSTICS_ENABLED, METRICS_ENABLED<% if(addTracing) {%>, OTEL_TRACING_ENABLED<%}%> } = process.env,
  <%_ if(addTracing) {_%>
  tracingEnabled = JSON.parse(OTEL_TRACING_ENABLED),
  <%_}_%>
  diagnosticsEnabled = JSON.parse(DIAGNOSTICS_ENABLED),
  metricsEnabled = JSON.parse(METRICS_ENABLED),
  {startMetrics, startDiagnostics} = require('@totalsoft/metrics')

<%_ if(addTracing) {_%>
  if (tracingEnabled) tracer.start({ logger })
<%_}_%>

const httpServer = createServer();
<%_ if(addSubscriptions){ _%>
const subscriptionServer = startSubscriptionServer(httpServer);
<%_}_%>
const apolloServerPromise = startApolloServer(httpServer<% if(addSubscriptions) {%>, subscriptionServer<%}%>);
<%_ if(addMessaging) {_%>
const msgHost = startMsgHost();
<%_}_%>

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  logger.info(`🚀 Server ready at http://localhost:${port}/graphql`)
  <%_ if(addSubscriptions){ _%>
  logger.info(`🚀 Subscriptions ready at ws://localhost:${port}/graphql`)
  <%_}_%>
})

async function cleanup() {
  await configMonitor?.close();
  <%_ if(addMessaging) {_%>
  await msgHost?.stop();
  <%_}_%>
  await (await apolloServerPromise)?.stop();
  <%_ if(addTracing) {_%>
    await tracer?.shutdown({ logger });
  <%_}_%>
}

const { gracefulShutdown } = require('@totalsoft/graceful-shutdown');
gracefulShutdown({
  onShutdown: cleanup,
  terminationSignals: ['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'],
  unrecoverableEvents: ['uncaughtException', 'unhandledRejection'],
  logger,
  timeout: 5000
})

diagnosticsEnabled && startDiagnostics(logger);
metricsEnabled && startMetrics(logger);

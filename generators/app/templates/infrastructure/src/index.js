//env
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    const path = `.env`;
    dotenv.config({ path });
}

if (process.env.NODE_ENV) {
  dotenv.config({ path: `./.env.${process.env.NODE_ENV}`, override: true });
}

const keyPerFileEnv = require('@totalsoft/key-per-file-configuration')
const configMonitor = keyPerFileEnv.load()

require('console-stamp')(global.console, {
    format: ':date(yyyy/mm/dd HH:MM:ss.l)'
  })

const { logger<% if(addTracing) {%>, tracer<%}%> } = require("./startup"),
{ createServer } = require("http"),
{ startApolloServer<% if(addMessaging) { %>, startMsgHost <% } %> <% if(addSubscriptions){ %>, startSubscriptionServer <% } %>} = require('./servers')


<%_ if(dataLayer == 'prisma') {_%>
const { initialize } = require('./prisma')
initialize({ logger })
<%_}_%>

// Metrics, diagnostics
const
  { DIAGNOSTICS_ENABLED, METRICS_ENABLED<% if(addTracing) {%>, OTEL_TRACING_ENABLED<%}%> } = process.env,
  <%_ if(addTracing) {_%>
  tracingEnabled = JSON.parse(OTEL_TRACING_ENABLED),
  <%_}_%>
  diagnosticsEnabled = JSON.parse(DIAGNOSTICS_ENABLED),
  metricsEnabled = JSON.parse(METRICS_ENABLED),
  diagnostics = require("./monitoring/diagnostics"),
  metrics = require("./monitoring/metrics");

<%_ if(addTracing) {_%>
tracingEnabled && tracer.start({ logger });
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

diagnosticsEnabled && diagnostics.startServer(logger);
metricsEnabled && metrics.startServer(logger);

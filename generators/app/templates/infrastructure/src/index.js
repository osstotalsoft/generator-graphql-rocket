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

const { graphqlUploadKoa } = require('graphql-upload')
require('console-stamp')(global.console, {
    format: ':date(yyyy/mm/dd HH:MM:ss.l, utc)'
  })

const { ApolloServer<% if(addSubscriptions){ %>, ForbiddenError <%}%>} = require('apollo-server-koa'),
  Koa = require("koa"),
  { ApolloServerPluginDrainHttpServer } = require("apollo-server-core"),
  { createServer } = require('http')

// Auth
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");

<%_ if(addMessaging) {_%>
// Messaging
const { msgHandlers, middleware } = require("./messaging"),
  { messagingHost, exceptionHandling, dispatcher, SubscriptionOptions } = require("@totalsoft/messaging-host")
<%_}_%>

// Logging
const { ApolloLoggerPlugin } = require("@totalsoft/pino-apollo"),
  { logger } = require("./startup");

<%_ if(dataLayer == 'prisma') {_%>
const { initialize } = require('./prisma')
initialize({ logger })
<%_}_%>

<%_ if(addTracing){ _%>
// Tracing
const tracingPlugin = require('./plugins/tracing/tracingPlugin'),
  { initGqlTracer, getApolloTracerPluginConfig } = require("./tracing/gqlTracer"),
  opentracing = require('opentracing'),
  defaultTracer = initGqlTracer({ logger }),
  { JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED)

opentracing.initGlobalTracer(defaultTracer)
<%_}_%>

// Metrics, diagnostics
const
  { DIAGNOSTICS_ENABLED, METRICS_ENABLED } = process.env,
  diagnosticsEnabled = JSON.parse(DIAGNOSTICS_ENABLED),
  metricsEnabled = JSON.parse(METRICS_ENABLED),
  diagnostics = require("./monitoring/diagnostics"),
  metrics = require("./monitoring/metrics"),
  metricsPlugin = require("./plugins/metrics/metricsPlugin")

<%_ if(withMultiTenancy){ _%>
// MultiTenancy
const { tenantService<% if(dataLayer == "knex") {%>, tenantContextAccessor<%}%> } = require("@totalsoft/multitenancy-core"),
  isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')
<%_}_%>

<%_ if(addSubscriptions){ _%>
// Subscriptions
const { middleware: subscriptionMiddleware, subscribe } = require("./subscriptions");
const jsonwebtoken = require('jsonwebtoken'),
  { WebSocketServer } = require("ws"),
  { useServer } = require("graphql-ws/lib/use/ws")
<%_}_%>

<%_ if(dataLayer == "knex") {_%>
const { dbInstanceFactory } = require("./db")
<%_}_%>
const { jwtTokenValidation, jwtTokenUserIdentification, <% if(dataLayer == "knex") {%>contextDbInstance, <%}%> <% if(addSubscriptions){ %>validateWsToken,  <%}%>
  <% if(withMultiTenancy){ %>tenantIdentification, <%}%>correlationMiddleware, <% if(addTracing){ %>tracingMiddleware ,<%}%> errorHandlingMiddleware } = require("./middleware"),
  { schema, <% if(addSubscriptions){ %>initializedDataSources, <%}%>getDataSources<% if(dataLayer == "knex") {%>, getDataLoaders <%}%>} = require('./startup/index')

let apolloServer;

const loggingMiddleware = async (ctx, next) => {
  ctx.logger = logger;
  await next();
};

const { publicRoute } = require('./utils/functions'),
ignore = require('koa-ignore')

async function startServer(httpServer) {
  const app = new Koa();
  app.use(loggingMiddleware)
  app.use(errorHandlingMiddleware())
  app.use(bodyParser());
  app.use(graphqlUploadKoa({ maxFieldSize: 10000000, maxFiles: 2 }))
  app.use(correlationMiddleware());
  <%_ if(addTracing){ _%>
  tracingEnabled && app.use(tracingMiddleware());
  <%_}_%>
  app.use(cors({ credentials: true }));
  app.use(ignore(jwtTokenValidation, jwtTokenUserIdentification<% if(withMultiTenancy) {%>, tenantIdentification()<%}%>).if(ctx => publicRoute(ctx)))
  <%_ if(dataLayer == "knex") {_%>
  app.use(contextDbInstance());
  <%_}_%>

  const plugins = [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    new ApolloLoggerPlugin({ logger, securedMessages: false }),
    <%_ if(addSubscriptions) {_%>
    {
        async serverWillStart() {
            return {
            async drainServer() {
                await subscriptionServer.dispose();
            }
            };
        }
    },
    <%_}_%>
    <%_ if(addTracing){ _%>
        tracingEnabled ? tracingPlugin(getApolloTracerPluginConfig(defaultTracer)) : {},
    <%_}_%>
    metricsEnabled ? metricsPlugin() : {}
  ]


  <%_ if(addSubscriptions){ _%>
  logger.info('Creating Subscription Server...')
  const subscriptionServer = useServer(
    {
      schema,
      onConnect: async ctx => {
        const connectionParams = ctx?.connectionParams;
        const token = connectionParams.authorization.replace("Bearer ", "");
        if (!token) {
          throw new ForbiddenError("401 Unauthorized");
        }
        ctx.token = token;

        await validateWsToken(token, ctx?.extra?.socket);

        const decoded = jsonwebtoken.decode(token);
        ctx.externalUser = {
          id: decoded?.sub,
          role: decoded?.role
        };

        <%_ if(withMultiTenancy){ _%>
            if (isMultiTenant) {
              const tenantId = decoded?.tid;
              ctx.tenant = await tenantService.getTenantFromId(tenantId);
            } else {
              ctx.tenant = {};
            }
        <%_}_%>

        ctx.state = {jwtdata:decoded, token}
      },
      subscribe: subscribe({
        middleware: [subscriptionMiddleware.correlation<% if(withMultiTenancy) {%>, subscriptionMiddleware.tenantContext<%}%><% if(addTracing) {%>, subscriptionMiddleware.tracing<%}%>],
        <% if(withMultiTenancy) {%>filter: ctx => message => ctx?.tenant?.id?.toLowerCase() === message?.headers?.pubSubTenantId?.toLowerCase()<%}%>
      }),
      onSubscribe: async (ctx, msg) => {
        await validateWsToken(ctx?.token, ctx?.extra?.socket);
        metrics.recordSubscriptionStarted(ctx, msg);
      },
      onDisconnect: (_ctx, code, reason) =>
        code != 1000 && logger.info(`Subscription server disconnected! Code: ${code} Reason: ${reason}`),
      onError: (ctx, msg, errors) => logger.error("Subscription error!", { ctx, msg, errors }),
      context: async (ctx, msg, _args) => {
        <%_ if(withMultiTenancy){ _%>
            const { tenant } = ctx;
        <%_}_%>
        <%_ if(dataLayer == "knex") {_%>
            const dbInstance = await dbInstanceFactory(<% if(withMultiTenancy){ %>tenant?.id, <%}%>{ logger })

            if (!dbInstance) {
                throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
            }
        <%_}_%>
        const dataSources = getDataSources()
        const subscriptionLogger = logger.child({ operationName: msg?.payload?.operationName });

        return {
            ...ctx,
            <%_ if(withMultiTenancy){ _%>
              tenant,
            <%_}_%>
            <%_ if(dataLayer == "knex") {_%>
            dbInstance,
            <%_ if(withMultiTenancy){ _%>
            dataSources: tenantContextAccessor.useTenantContext({ tenant }, async () =>
              initializedDataSources(ctx, dbInstance, dataSources)
            ),
            <%_} else {_%>
            dataSources: initializedDataSources(ctx, dbInstance, dataSources),
            <%_}_%>
            dataLoaders: getDataLoaders(dbInstance),
            <%_}else{_%>
            dataSources: initializedDataSources(ctx, dataSources),
            <%_}_%>
            logger: subscriptionLogger
        }
      }
    },
    new WebSocketServer({
      server: httpServer,
      path: "/graphql"
    })
  );
  <%_}_%>

logger.info("Creating Apollo Server...");
apolloServer = new ApolloServer({
    schema,
    stopOnTerminationSignals: false,
    uploads: false,
    plugins,
    dataSources: getDataSources,
    context: async ({ ctx }) => {
      const { token, state, <% if(withMultiTenancy){ %>tenant, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> externalUser, request, requestSpan } = ctx;
      return {
        token,
        state,
        <%_ if(dataLayer == "knex") {_%>
        dbInstance,
        dbInstanceFactory,
        dataLoaders: getDataLoaders(dbInstance),
        <%_}_%>
        <%_ if(withMultiTenancy){ _%>
        tenant,
        <%_}_%>
        externalUser,
        request,
        requestSpan,
        logger
      }
    }
  })

  await apolloServer.start()
  apolloServer.getMiddleware({ cors: {} })
  apolloServer.applyMiddleware({ app })
  httpServer.on('request', app.callback())

}

const httpServer = createServer()
startServer(httpServer)
const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  logger.info(`🚀 Server ready at http://localhost:${port}/graphql`)
  <%_ if(addSubscriptions){ _%>
  logger.info(`🚀 Subscriptions ready at ws://localhost:${port}/graphql`)
  <%_}_%>
})

<%_ if(addMessaging && addTracing){ _%>
const skipMiddleware = (_ctx, next) => next()
<%_}_%>
<%_ if(addMessaging) {_%>

const msgHost = messagingHost();
msgHost
    .subscribe(Object.keys(msgHandlers), SubscriptionOptions.PUB_SUB)
    .use(exceptionHandling())
    .use(middleware.correlation())
    <%_ if(addMessaging && withMultiTenancy) {_%>
    .use(middleware.tenantIdentification())
    <%_}_%>
    <%_ if(addMessaging && addTracing){ _%>
    .use(tracingEnabled ? middleware.tracing() : skipMiddleware)
    <%_}_%>
    .use(loggingMiddleware)
    <%_ if(dataLayer == "knex") {_%>
    .use(middleware.dbInstance())
    <%_}_%>
    .use(dispatcher(msgHandlers))
    .start()
    .catch((err) => {
        logger.error(err)
        setImmediate(() => {
          throw err
        })
      })
<%_}_%>

async function cleanup() {
  await configMonitor?.close();
  <%_ if(addMessaging) {_%>
  await msgHost?.stop();
  <%_}_%>
  await apolloServer?.stop();
  <%_ if(addTracing) {_%>
  defaultTracer?.close();
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

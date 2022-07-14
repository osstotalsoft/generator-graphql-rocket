//env
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    const path = `.env`;
    dotenv.config({ path });
}

if (process.env.NODE_ENV) {
  dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });
}

const keyPerFileEnv = require('@totalsoft/key-per-file-configuration')
const configMonitor = keyPerFileEnv.load()

const { graphqlUploadKoa } = require('graphql-upload')
require('console-stamp')(global.console, {
    format: ':date(yyyy/mm/dd HH:MM:ss.l)'
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
const { msgHandlers <% if(dataLayer == "knex" || addTracing || withMultiTenancy) {%>, middleware <%}%> } = require("./messaging"),
  { messagingHost, exceptionHandling, correlation, dispatcher } = require("@totalsoft/messaging-host")
<%_}_%>

<%_ if(addGqlLogging) {_%>
// Logging
const { ApolloLoggerPlugin, initializeLogger } = require('@totalsoft/apollo-logger'),
  { saveLogs } = require('./utils/logging')
<%_}_%>

<%_ if(addTracing){ _%>
// Tracing
const tracingPlugin = require('./plugins/tracing/tracingPlugin'),
  { initGqlTracer, getApolloTracerPluginConfig } = require("./tracing/gqlTracer"),
  opentracing = require('opentracing'),
  defaultTracer = initGqlTracer(),
  { JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED)

opentracing.initGlobalTracer(defaultTracer)
<%_}_%>

<%_ if(withMultiTenancy){ _%>
// MultiTenancy
const { introspectionRoute } = require('./utils/functions'),
  ignore = require('koa-ignore'),
<%_ if(addSubscriptions){ _%>
  { tenantService } = require("@totalsoft/tenant-configuration"),
<%_}_%>
  isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')
<%_}_%>

<%_ if(addSubscriptions){ _%>
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

async function startServer(httpServer) {
const app = new Koa();

app.use(errorHandlingMiddleware())
app.use(bodyParser());
app.use(graphqlUploadKoa({ maxFieldSize: 10000000, maxFiles: 2 }))
app.use(correlationMiddleware());
<%_ if(addTracing){ _%>
tracingEnabled && app.use(tracingMiddleware());
<%_}_%>
app.use(cors());
<%_ if(withMultiTenancy){ _%>
app.use(ignore(jwtTokenValidation, jwtTokenUserIdentification, tenantIdentification()).if(ctx => introspectionRoute(ctx)))
<%_} else {_%>
app.use(jwtTokenValidation);
app.use(jwtTokenUserIdentification);
<%_}_%>
<%_ if(dataLayer == "knex") {_%>
app.use(contextDbInstance());
<%_}_%>

<%_ if(addGqlLogging || addTracing || addSubscriptions) {_%>
const plugins = [
    ApolloServerPluginDrainHttpServer({ httpServer }),
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
    <%_ if(addGqlLogging) {_%>
      new ApolloLoggerPlugin({ persistLogs: true, persistLogsFn: saveLogs, securedMessages: true }),
    <%_}_%>
    <%_ if(addTracing){ _%>
        tracingEnabled ? tracingPlugin(getApolloTracerPluginConfig(defaultTracer)) : {}
    <%_}_%>
]
<%_}_%>


<%_ if(addSubscriptions){ _%>
console.info('Creating Subscription Server...')
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
      },
      onSubscribe: async ctx => await validateWsToken(ctx?.token, ctx?.extra?.socket),
      onDisconnect: (_ctx, code, reason) =>
        code != 1000 && console.info(`Subscription server disconnected! Code: ${code} Reason: ${reason}`),
      onError: (ctx, msg, errors) => console.error("Subscription error!", { ctx, msg, errors }),
      context: async (ctx, <% if(addGqlLogging){ %>_<%}%>msg, _args) => {
        <%_ if(withMultiTenancy){ _%>
            const { tenant } = ctx;
        <%_}_%>
        <%_ if(dataLayer == "knex") {_%>
            const dbInstance = await dbInstanceFactory(<% if(withMultiTenancy){ %>tenant?.id<%}%>)

            if (!dbInstance) {
                throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
            }
        <%_}_%>
        const dataSources = getDataSources()
        <%_ if(addGqlLogging){ _%>
        const { logInfo, logDebug, logError } = initializeLogger(<% if(dataLayer == "knex") {%>{...ctx, dbInstance}<%} else {%> ctx <%}%>, msg?.payload?.operationName, true, saveLogs)
        <%_}_%>

        return {
            ...ctx,
            <%_ if(withMultiTenancy){ _%>
              tenant,
            <%_}_%>
            <%_ if(dataLayer == "knex") {_%>
            dbInstance,
            dataSources: initializedDataSources(ctx, dbInstance, dataSources),
            dataLoaders: getDataLoaders(dbInstance),
            <%_}else{_%>
            dataSources: initializedDataSources(ctx, dataSources),
            <%_}_%>
            <%_ if(addGqlLogging){ _%>
            logger: { logInfo, logDebug, logError }
            <%_}_%>
        }
      }
    },
    new WebSocketServer({
      server: httpServer,
      path: "/graphql"
    })
  );
<%_}_%>

console.info('Creating Apollo Server...')
const server = new ApolloServer({
    schema,
    uploads: false,
    <%_ if(addGqlLogging || addTracing || addSubscriptions) {_%>
    plugins,
    <%_}_%>
    dataSources: getDataSources,
    context: async ({ ctx }) => {
        const { token, <% if(withMultiTenancy){ %>tenant, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> externalUser, correlationId, request, requestSpan } = ctx;
        <%_ if(addGqlLogging) {_%>
          const { logInfo, logDebug, logError } = initializeLogger(<% if(dataLayer == "knex") {%>{...ctx, dbInstance}<%} else {%> ctx <%}%>, request?.body?.operationName, true, saveLogs)
        <%_}_%>
        return {
            token,
            <%_ if(dataLayer == "knex") {_%>
            dbInstance,
            dbInstanceFactory,
            dataLoaders: getDataLoaders(dbInstance),
            <%_}_%>
            <%_ if(withMultiTenancy){ _%>
            tenant,
            <%_}_%>
            externalUser,
            correlationId,
            request,
            requestSpan
            <%_ if(addGqlLogging) {_%>,
            logger: { logInfo, logDebug, logError }
            <%_}_%>
        };
    }
})

await server.start()
server.getMiddleware({ cors: {} })
server.applyMiddleware({ app })
httpServer.on('request', app.callback())

process.on('uncaughtException', function (error) {
    throw new Error(`Error occurred while processing the request: ${error.stack}`)
  })
}

const httpServer = createServer()
startServer(httpServer)
const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`)
    <%_ if(addSubscriptions){ _%>
    console.log(`🚀 Subscriptions ready at ws://localhost:${port}/graphql`)
    <%_}_%>
  })

<%_ if(addMessaging && addTracing){ _%>
const skipMiddleware = (_ctx, next) => next()
<%_}_%>
<%_ if(addMessaging) {_%>
const msgHost = messagingHost();
msgHost
    .subscribe([/*topics*/])
    .use(exceptionHandling())
    .use(correlation())
    <%_ if(addMessaging && addTracing){ _%>
    .use(tracingEnabled ? middleware.tracing() : skipMiddleware)
    <%_}_%>
    <%_ if(addMessaging && withMultiTenancy) {_%>
    .use(middleware.tenantIdentification())
    <%_}_%>
    <%_ if(dataLayer == "knex") {_%>
    .use(middleware.dbInstance())
    <%_}_%>
    .use(dispatcher(msgHandlers))
    .start()
    .catch((err) => {
        console.error(err)
        setImmediate(() => {
          throw err
        })
      })
<%_}_%>

process.on("SIGINT", () => {
    configMonitor.close()
    <%_ if(addMessaging) {_%>
    msgHost.stopImmediate();
    <%_}_%>
});
process.on("SIGTERM", () => {
    configMonitor.close()
    <%_ if(addMessaging) {_%>
    msgHost.stopImmediate();
    <%_}_%>
});


process.on('uncaughtException', function (error) {
    configMonitor.close()
    <%_ if(addMessaging) {_%>
    msgHost.stopImmediate();
    <%_}_%>
    throw new Error(`Error occurred while processing the request: ${error.stack}`)
})

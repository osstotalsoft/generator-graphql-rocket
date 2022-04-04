//env
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    const path = `.env`;
    dotenv.config({ path });
}
const { graphqlUploadKoa } = require('graphql-upload')
require('console-stamp')(global.console, {
    format: ':date(yyyy/mm/dd HH:MM:ss.l)'
  })

const { ApolloServer<% if(addSubscriptions){ %>, ForbiddenError <%}%>} = require('apollo-server-koa');
const Koa = require("koa");

// Auth
// eslint-disable-next-line node/no-extraneous-require
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");

<%_ if(addMessaging) {_%>
// Messaging
const { msgHandlers, middleware } = require("./messaging")
const { messagingHost, exceptionHandling, correlation, dispatcher } = require("@totalsoft/messaging-host")
<%_}_%>
<%_ if(addGqlLogging) {_%>
// Logging
const { initializeDbLogging } = require('./plugins/logging/loggingUtils');
const loggingPlugin = require('./plugins/logging/loggingPlugin')
const { v4 } = require('uuid');
<%_}_%>
<%_ if(addTracing){ _%>
// Tracing
const tracingPlugin = require('./plugins/tracing/tracingPlugin');
const { initGqlTracer, getApolloTracerPluginConfig } = require("./tracing/gqlTracer");
const opentracing = require('opentracing');
const defaultTracer = initGqlTracer();
opentracing.initGlobalTracer(defaultTracer);
const { JAEGER_DISABLED } = process.env;
const tracingEnabled = !JSON.parse(JAEGER_DISABLED)
<%_}_%>
<%_ if(withMultiTenancy){ _%>
// MultiTenancy
const { introspectionRoute } = require('./utils/functions')
const ignore = require('koa-ignore')
<%_ if(addSubscriptions){ _%>
    const tenantFactory = require('./multiTenancy/tenantFactory');
<%_}_%>
<%_}_%>


const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core"),
<%_ if(addSubscriptions){ _%>
const jsonwebtoken = require('jsonwebtoken'),
  { createServer } = require("http"),
  { WebSocketServer } = require("ws"),
  { useServer } = require("graphql-ws/lib/use/ws");
<%_}_%>

const { createServer } = require('http')

<%_ if(dataLayer == "knex") {_%>
const { dbInstanceFactory } = require("./db");
<%_}_%>
const { <% if(dataLayer == "knex") {%>contextDbInstance, <%}%> <% if(addSubscriptions){ %>validateWsToken,  <%}%>jwtTokenValidation, jwtTokenUserIdentification,
    <% if(withMultiTenancy){ %>tenantIdentification, <%}%>correlationMiddleware, <% if(addTracing){ %>tracingMiddleware ,<%}%> errorHandlingMiddleware } = require("./middleware");
const { schema, <% if(addSubscriptions){ %>initializedDataSources, <%}%>getDataSources<% if(dataLayer == "knex") {%>, getDataLoaders <%}%>} = require('./startup/index');

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
        loggingPlugin,
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
            ctx.externalTenantId = decoded?.tid
            const tenant = await tenantFactory.getTenantFromId(decoded?.tid) ?? {};
            ctx.tenantId = tenant?.id
        <%_}_%>
      },
      onSubscribe: async ctx => await validateWsToken(ctx?.token, ctx?.extra?.socket),
      onDisconnect: (_ctx, code, reason) =>
        code != 1000 && console.info(`Subscription server disconnected! Code: ${code} Reason: ${reason}`),
      onError: (ctx, msg, errors) => console.error("Subscription error!", { ctx, msg, errors }),
      context: async (ctx, msg, _args) => {
        <%_ if(withMultiTenancy){ _%>
            const { tenantId } = ctx;
        <%_}_%>
        <%_ if(dataLayer == "knex") {_%>
            const dbInstance = await dbInstanceFactory(<% if(withMultiTenancy){ %>tenantId <%}%>)

            if (!dbInstance) {
                throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
            }
        <%_}_%>
        const dataSources = getDataSources()
        <%_ if(addGqlLogging){ _%>
        const { logInfo, logDebug, logError } = initializeDbLogging(
          { dbInstance, requestId: v4() },
          msg?.payload?.operationName
        );
        <%_}_%>

        return {
            ...ctx,
            <%_ if(dataLayer == "knex") {_%>
            dbInstance,
            dataSources: initializedDataSources(context, dbInstance, dataSources),
            dataLoaders: getDataLoaders(dbInstance),
            <%_}else{_%>
            dataSources: initializedDataSources(context, dataSources),
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
        const { token, <% if(withMultiTenancy){ %>tenantId, externalTenantId, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> externalUser, correlationId, request, requestSpan } = ctx;
        <%_ if(addGqlLogging) {_%>
            const { logInfo, logDebug, logError } = initializeDbLogging({ ...ctx, requestId: v4() }, request.operationName)
        <%_}_%>
        return {
            token,
            <%_ if(dataLayer == "knex") {_%>
            dbInstance,
            dbInstanceFactory,
            dataLoaders: getDataLoaders(dbInstance),
            <%_}_%>
            <%_ if(withMultiTenancy){ _%>
            externalTenantId,
            tenantId,
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
// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
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

process.on("SIGINT", () => {
    msgHost.stopImmediate();
});
process.on("SIGTERM", () => {
    msgHost.stopImmediate();
});
<%_}_%>

process.on('uncaughtException', function (error) {
    <%_ if(addMessaging) {_%>
    msgHost.stopImmediate();
    <%_}_%>
    throw new Error(`Error occurred while processing the request: ${error.stack}`)
})

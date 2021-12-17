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
<%_ if(dataLayer == "knex" && addSubscriptions && withMultiTenancy){ _%>
// MultiTenancy
const tenantService = require('./multiTenancy/tenantService');
<%_}_%>

<%_ if(addSubscriptions){ _%>
const jsonwebtoken = require('jsonwebtoken');

const { execute, subscribe } = require('graphql')
const { SubscriptionServer } = require('subscriptions-transport-ws')
<%_}_%>

const { createServer } = require('http')

<%_ if(dataLayer == "knex") {_%>
const { dbInstanceFactory } = require("./db");
<%_}_%>
const { <% if(dataLayer == "knex") {%>contextDbInstance, <%}%> <% if(addSubscriptions){ %>validateToken,  <%}%>jwtTokenValidation, jwtTokenUserIdentification,
    <% if(dataLayer == "knex" && withMultiTenancy){ %>tenantIdentification, <%}%>correlationMiddleware, <% if(addTracing){ %>tracingMiddleware ,<%}%> errorHandlingMiddleware } = require("./middleware");
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
app.use(jwtTokenValidation);
app.use(jwtTokenUserIdentification);
<%_ if(dataLayer == "knex") {_%>
    <%_ if(withMultiTenancy){ _%>
app.use(tenantIdentification());
    <%_}_%>
app.use(contextDbInstance());
<%_}_%>
       
<%_ if(addGqlLogging || addTracing || addSubscriptions) {_%>
const plugins = [
    <%_ if(addSubscriptions) {_%>
    {
        async serverWillStart() {
            return {
            async drainServer() {
                subscriptionServer.close()
            }
            }
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
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      async onConnect(connectionParams, _webSocket, context) {
        const token = connectionParams.authorization.replace("Bearer ", "");

            if (!token) {
                throw new ForbiddenError("401 Unauthorized");
            }

            await validateToken(token);

            const decoded = jsonwebtoken.decode(token);
            <%_ if(dataLayer == "knex") {_%>
                <%_ if(addSubscriptions && withMultiTenancy){ _%>
            const tenantId = decoded.tid
            const tenant = await tenantService.getTenantFromId(tenantId);
                <%_}_%>
            
            const dbInstance = await dbInstanceFactory(<% if(dataLayer == "knex" && withMultiTenancy){ %>tenant.id <%}%>)

            if (!dbInstance) {
                throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
            }
            <%_}_%>
            const dataSources = getDataSources()
            return {
                token,
                <%_ if(addSubscriptions && dataLayer == "knex" && withMultiTenancy){ _%>
                tenant,
                <%_}_%>
                <%_ if(dataLayer == "knex") {_%>
                dbInstance,
                dataSources: initializedDataSources(context, dbInstance, dataSources),
                dataLoaders: getDataLoaders(dbInstance),
                <%_}_%>
                dataSources: initializedDataSources(context, dataSources),
                externalUser: {
                    id: decoded.sub,
                    role: decoded.role
                }
            }
        }
    },
    {
      server: httpServer,
      path: '/graphql'
    }
  )
<%_}_%>

console.info('Creating Apollo Server...')
const server = new ApolloServer({
    schema,
    uploads: false,
    <%_ if(addGqlLogging || addTracing || addSubscriptions) {_%>
    plugins,
    <%_}_%>
    dataSources: getDataSources,
    context: async context => {
        const { ctx, connection } = context;

        if (connection) {
            <%_ if(addSubscriptions && addGqlLogging){ _%>
                const { logInfo, logDebug, logError } = initializeDbLogging({  ...connection.context, requestId: v4() }, connection.operationName)
            <%_}_%>
            return {
                ...connection.context<% if(addSubscriptions && addGqlLogging){ %>,
                logger: { logInfo, logDebug, logError }
                <%_}_%>
            };
        } else {
            const { token, <% if(dataLayer == "knex" && withMultiTenancy){ %>tenant, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> externalUser, correlationId, request, requestSpan } = ctx;
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
                <%_ if(dataLayer == "knex" && withMultiTenancy){ _%>
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
    <%_ if(addMessaging && dataLayer == "knex" && withMultiTenancy) {_%>
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

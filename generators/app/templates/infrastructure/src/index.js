//env
const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    const path = `.env`;
    dotenv.config({ path });
}
const { customConsole } = require('./utils/functions')
global.console = customConsole;

const { ApolloServer<% if(addSubscriptions){ %>, ForbiddenError <%}%>} = require('apollo-server-koa');
const Koa = require("koa");

// Auth
// eslint-disable-next-line node/no-extraneous-require
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");

<%_ if(addSubscriptions && addMessaging) {_%>
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
const tenantService = require('./multiTenancy/tenantService');
<%_}_%>

<%_ if(addSubscriptions){ _%>
const jsonwebtoken = require('jsonwebtoken');
<%_}_%>
const { dbInstanceFactory } = require("./db");
const { contextDbInstance, <% if(addSubscriptions){ %>validateToken,  <%}%>jwtTokenValidation, jwtTokenUserIdentification,
    <% if(withMultiTenancy){ %>tenantIdentification, <%}%>correlationMiddleware, <% if(addTracing){ %>tracingMiddleware ,<%}%> errorHandlingMiddleware } = require("./middleware");
const { schema, <% if(addSubscriptions){ %>initializedDataSources, <%}%>getDataSources, getDataLoaders } = require('./startup/index');

const app = new Koa();

app.use(errorHandlingMiddleware())
app.use(bodyParser());
app.use(correlationMiddleware());
<%_ if(addTracing){ _%>
tracingEnabled && app.use(tracingMiddleware());
<%_}_%>
app.use(cors());
app.use(jwtTokenValidation);
app.use(jwtTokenUserIdentification);
<%_ if(withMultiTenancy){ _%>
app.use(tenantIdentification());
<%_}_%>
app.use(contextDbInstance());

const server = new ApolloServer({
    schema,
    <%_ if(addGqlLogging || addTracing) {_%>
    plugins: [
        <%_ if(addGqlLogging) {_%>
        loggingPlugin,
        <%_}_%>
        <%_ if(addTracing){ _%>
        tracingEnabled && tracingPlugin(getApolloTracerPluginConfig(defaultTracer))
        <%_}_%>
    ],
    <%_}_%>
    <%_ if(addTracing){ _%>
    tracing: true,
    <%_}_%>
    dataSources: getDataSources,
    <%_ if(addSubscriptions){ _%>
    subscriptions: {
        onConnect: async (connectionParams, _webSocket, context) => {
            const token = connectionParams.authToken;

            if (!token) {
                throw new ForbiddenError("401 Unauthorized");
            }

            await validateToken(token);

            const decoded = jsonwebtoken.decode(token);
            <%_ if(addSubscriptions && withMultiTenancy){ _%>
            const tenantId = decoded.tid
            const tenant = await tenantService.getTenantFromId(tenantId);
            <%_}_%>

            const dbInstance = await dbInstanceFactory(<% if(withMultiTenancy){ %>tenant.id <%}%>)

            if (!dbInstance) {
                throw new TypeError("Could not create dbInstance. Check the database configuration info and restart the server.")
            }
            return {
                token,
                <%_ if(addSubscriptions && withMultiTenancy){ _%>
                tenant,
                <%_}_%>
                dbInstance,
                dataSources: initializedDataSources(context, dbInstance),
                dataLoaders: getDataLoaders(dbInstance),
                externalUser: {
                    id: decoded.sub,
                    role: decoded.role
                }
            }
        }
    },
    <%_}_%>
    context: async context => {
        const { ctx, connection } = context;

        if (connection) {
            <%_ if(addSubscriptions && addGqlLogging){ _%>
                const { dbInstance } = connection.context
                const { logInfo, logDebug, logError } = initializeDbLogging({ dbInstance, requestId: v4() }, connection.operationName)
            <%_}_%>
            return {
                ...connection.context<% if(addSubscriptions && addGqlLogging){ %>,
                logger: { logInfo, logDebug, logError }
                <%_}_%>
            };
        } else {
            const { token, <% if(withMultiTenancy){ %>tenant, <%}%>dbInstance, externalUser, correlationId, request, requestSpan } = ctx;
            <%_ if(addGqlLogging) {_%>
            const { logInfo, logDebug, logError } = initializeDbLogging({ dbInstance, requestId: v4() }, request.operationName)
            <%_}_%>
            return {
                token,
                dbInstance,
                dataLoaders: getDataLoaders(dbInstance),
                <%_ if(withMultiTenancy){ _%>
                tenant, 
                <%_}_%>
                dbInstanceFactory,
                externalUser,
                correlationId,
                request,               
                requestSpan
                <%_ if(addGqlLogging) {_%>,
                logger: { logInfo, logDebug, logError }
                <%_}_%>
            };
        }
    },
    uploads: {
        // Limits here should be stricter than config for surrounding
        // infrastructure such as Nginx so errors can be handled elegantly by
        // graphql-upload:
        // https://github.com/jaydenseric/graphql-upload#type-processrequestoptions
        maxFileSize: 1000000, // 1 MB
        maxFiles: 20,
    }
});

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
const port = process.env.PORT || 4000;
<% if(addSubscriptions){ %>const httpServer = <%}%>app.listen(port, () => {
    console.log(`🚀  Server ready at http://localhost:${port}/graphql`);
    <%_ if(addSubscriptions){ _%>
    console.log(`🚀  Subscriptions ready at ws://localhost:${port}/graphql`);
    <%_}_%>
})

server.applyMiddleware({ app });
<%_ if(addSubscriptions){ _%>
server.installSubscriptionHandlers(httpServer);
<%_}_%>

process.on('uncaughtException', function (error) {
    throw new TypeError(`Error occurred while processing the request: ${error.stack}`)
})

<%_ if(addSubscriptions) {_%>
<%_ if(addMessaging && addTracing){ _%>
const skipMiddleware = (_ctx, next) => next()
<%_}_%>
<%_ if(addMessaging) {_%>
messagingHost()
    .subscribe([/*topics*/])
    .use(exceptionHandling())
    .use(correlation())
    <%_ if(addMessaging && addTracing){ _%>
    .use(tracingEnabled ? middleware.tracing() : skipMiddleware)
    <%_}_%>
    <%_ if(addMessaging && withMultiTenancy) {_%>
    .use(middleware.tenantIdentification())
    <%_}_%>
    .use(middleware.dbInstance())
    .use(dispatcher(msgHandlers))
    .start()
<%_}_%>
<%_}_%>
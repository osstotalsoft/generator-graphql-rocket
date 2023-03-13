const { ApolloServer } = require("@apollo/server"),
  Koa = require("koa"),
  { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer"),
  { ApolloLoggerPlugin } = require("@totalsoft/pino-apollo"),
  bodyParser = require("koa-bodyparser"),
  {
    errorHandlingMiddleware,
    correlationMiddleware,
  <%_ if(addTracing) {_%>
    tracingMiddleware,
  <%_}_%>
    loggingMiddleware,
    jwtTokenValidation,
    jwtTokenUserIdentification<% if(withMultiTenancy){ %>,tenantIdentification <%}%><% if(dataLayer == "knex") {%>,contextDbInstance <%}%>
  } = require("../middleware"),
  graphqlUploadKoa = require('graphql-upload/graphqlUploadKoa.js'),
  cors = require("@koa/cors"),
  { publicRoute } = require("../utils/functions"),
  ignore = require("koa-ignore"),
  { koaMiddleware } = require("@as-integrations/koa"),
  { schema, getDataSources<% if(dataLayer == "knex") {%>, getDataLoaders <%}%>, logger } = require("../startup"),
  { <% if(addTracing){ %>JAEGER_DISABLED,<% } %> METRICS_ENABLED } = process.env,
  <%_ if(addTracing){ _%>
  tracingEnabled = !JSON.parse(JAEGER_DISABLED),
  <%_}_%>
  metricsPlugin = require("../plugins/metrics/metricsPlugin"),
  metricsEnabled = JSON.parse(METRICS_ENABLED);
  <%_ if(dataLayer == "knex") {_%>
  const { dbInstanceFactory } = require("../db")
  <%_}_%>

const plugins = (httpServer<% if(addSubscriptions) {%>, subscriptionServer<%}%>) => {
    return [
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
        metricsEnabled ? metricsPlugin() : {}
    ];
};

const startApolloServer = async (httpServer<% if(addSubscriptions) {%>, subscriptionServer<%}%>) => {
  logger.info("Creating Apollo Server...");
    const apolloServer = new ApolloServer({
        schema,
        stopOnTerminationSignals: false,
        uploads: false,
        plugins: plugins(httpServer<% if(addSubscriptions) {%>, subscriptionServer<%}%>)
      })

      await apolloServer.start()

      const app = new Koa();
      app.use(loggingMiddleware)
      app.use(errorHandlingMiddleware())
      app.use(bodyParser());
      app.use(graphqlUploadKoa({ maxFieldSize: 10000000, maxFiles: 2 }))
      app.use(correlationMiddleware());
      app.use(cors({ credentials: true }));
      app.use(ignore(jwtTokenValidation, jwtTokenUserIdentification<% if(withMultiTenancy) {%>, tenantIdentification()<%}%>).if(ctx => publicRoute(ctx)))
      <%_ if(addTracing){ _%>
        tracingEnabled && app.use(tracingMiddleware());
      <%_}_%>
      <%_ if(dataLayer == "knex") {_%>
      app.use(contextDbInstance());
      <%_}_%>
      app.use(
        koaMiddleware(apolloServer,{
          context: async ({ ctx }) => {
            const { token, state, <% if(withMultiTenancy){ %>tenant, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> externalUser, request, requestSpan } = ctx;
            const { cache } = apolloServer
            const dataSources = getDataSources({ ...ctx, cache })
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
              logger,
              dataSources
            }
          }
        })
      )

    httpServer.on('request', app.callback())

    return apolloServer
  };

module.exports = { startApolloServer, plugins };

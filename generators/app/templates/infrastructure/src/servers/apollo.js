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
    jwtTokenUserIdentification<% if(withMultiTenancy){ %>,tenantIdentification <%}%>
  } = require("../middleware"),
  cors = require("@koa/cors"),
  { publicRoute } = require("../utils/functions"),
  ignore = require("koa-ignore"),
  { koaMiddleware } = require("@as-integrations/koa"),
  { schema, getDataSources, logger } = require("../startup"),
  { <% if(addTracing){ %> OTEL_TRACING_ENABLED,<% } %> METRICS_ENABLED } = process.env,
  <%_ if(addTracing){ _%>
  tracingEnabled = JSON.parse(OTEL_TRACING_ENABLED),
  <%_}_%>
  metricsPlugin = require("../plugins/metrics/metricsPlugin"),
  metricsEnabled = JSON.parse(METRICS_ENABLED);

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
        .use(errorHandlingMiddleware())
        .use(bodyParser())
        .use(correlationMiddleware())
        .use(cors({ credentials: true }))
        .use(ignore(jwtTokenValidation, jwtTokenUserIdentification<% if(withMultiTenancy) {%>, tenantIdentification()<%}%>).if(ctx => publicRoute(ctx)))
      <%_ if(addTracing){ _%>
        tracingEnabled && app.use(tracingMiddleware())
      <%_}_%>
        .use(
        koaMiddleware(apolloServer,{
          context: async ({ ctx }) => {
            const { token, state, <% if(withMultiTenancy){ %>tenant, <%}%>externalUser, request, requestSpan } = ctx;
            const { cache } = apolloServer
            const dataSources = getDataSources({ ...ctx, cache })
            return {
              token,
              state,
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

<%_ if(withMultiTenancy){ _%>
const { tenantService<% if(dataLayer == "knex") {%>, tenantContextAccessor<%}%> } = require("@totalsoft/multitenancy-core"),
isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || "false");
<%_}_%>
const { WebSocketServer } = require("ws");
<%_ if(dataLayer == "knex") {_%>
const { dbInstanceFactory } = require("../db")
<%_}_%>
const { correlation<% if(withMultiTenancy) {%>, tenantContext<%}%><% if(addTracing) {%>, tracing<%}%> } = require("../subscriptions/middleware"),
  { subscribe } = require("../subscriptions");

const { GraphQLError } = require("graphql"),
  { useServer } = require("graphql-ws/lib/use/ws"),
  { validateWsToken } = require("../middleware"),
  { schema, logger, getDataSources<% if(dataLayer == "knex") {%>, getDataLoaders <%}%> } = require("../startup"),
  jsonwebtoken = require("jsonwebtoken"),
  metrics = require("../monitoring/metrics");

logger.info('Creating Subscription Server...')
const startSubscriptionServer = httpServer => 
  useServer(
    {
      schema,
      onConnect: async ctx => {
        const connectionParams = ctx?.connectionParams;
        const token = connectionParams.authorization.replace("Bearer ", "");
        if (!token) {
          throw new GraphQLError("401 Unauthorized", { extensions: { code: "UNAUTHORIZED" } });
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
        middleware: [correlation<% if(withMultiTenancy) {%>, tenantContext<%}%><% if(addTracing) {%>, tracing<%}%>],
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
        <%_ if(!withMultiTenancy || dataLayer == "prisma") {_%>
        const dataSources = getDataSources(ctx)
        <%_}_%>
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
              getDataSources(ctx)
            ),
              <%_} else {_%>
            dataSources,
              <%_}_%>
            dataLoaders: getDataLoaders(dbInstance),
            <%_}else{_%>
            dataSources,
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

module.exports = startSubscriptionServer;
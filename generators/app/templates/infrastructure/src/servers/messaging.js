const { messagingHost, exceptionHandling, SubscriptionOptions, dispatcher } = require("@totalsoft/messaging-host");
const { msgHandlers, middleware } = require("../messaging");
const { loggingMiddleware } = require("../middleware");
const { logger, getDataLoaders } = require("../startup");
<%_ if(addTracing){ _%>
const { JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED);

  const skipMiddleware = (_ctx, next) => next();
<%_}_%>

<%_ if(dataLayer == "knex") {_%>
const dataLoadersMiddleware = async (ctx, next) => {
  const { dbInstance } = ctx;
  if (dbInstance) {
    ctx.dataLoaders = getDataLoaders(dbInstance);
  }
  await next();
}
<%_}_%>

module.exports = function startMsgHost() {
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
        .use(dataLoadersMiddleware)
        <%_}_%>
        .use(dispatcher(msgHandlers))
        .start()
        .catch((err) => {
            logger.error(err)
            setImmediate(() => {
              throw err
            })
          })
    return msgHost;
}

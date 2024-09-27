const { messagingHost, exceptionHandling, SubscriptionOptions, dispatcher } = require("@totalsoft/messaging-host");
const { msgHandlers, middleware } = require("../messaging");
const { loggingMiddleware } = require("../middleware");
const { logger } = require("../startup");
<%_ if(addTracing){ _%>
const { OTEL_TRACING_ENABLED } = process.env,
  tracingEnabled = JSON.parse(OTEL_TRACING_ENABLED)

  const skipMiddleware = (_ctx, next) => next();
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

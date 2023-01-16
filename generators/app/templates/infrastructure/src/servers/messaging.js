const { messagingHost, exceptionHandling, SubscriptionOptions, dispatcher } = require("@totalsoft/messaging-host");
const { msgHandlers, middleware } = require("../messaging");
const loggingMiddleware = require("../middleware/logger/loggingMiddleware");
const { logger } = require("../startup");
<%_ if(addTracing){ _%>
const { JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED);
<%_}_%>
const skipMiddleware = (_ctx, next) => next();

const startMsgHost = () => {
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
    return msgHost;
}

module.exports = startMsgHost;
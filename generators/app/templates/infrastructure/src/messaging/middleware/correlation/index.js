const { correlationManager } = require("../../../correlation");
const { envelope } = require('@totalsoft/message-bus')

const correlation = () => async (ctx, next) => {
  const correlationId = envelope.getCorrelationId(ctx.received.msg)
  await correlationManager.useCorrelationId(correlationId, next)
};

module.exports = correlation;

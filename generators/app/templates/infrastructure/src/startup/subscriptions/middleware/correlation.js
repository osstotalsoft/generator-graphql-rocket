const { correlationManager } = require("../../../correlation");

const correlation = async (ctx, next) => {
    return await correlationManager.useCorrelationId(ctx.message.headers?.pubsubCorrelationId, next)
};

module.exports = { correlation };

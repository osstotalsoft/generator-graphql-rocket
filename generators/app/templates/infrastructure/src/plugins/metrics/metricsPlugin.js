const metrics = require("../../monitoring/metrics");

module.exports = () => {
  return {
    requestDidStart(requestContext) {
      const requestStartDate = Date.now();
      metrics.recordRequestStarted(requestContext);

      return {
        didEncounterErrors: async context => {
          metrics.recordRequestFailed(context);
        },
        willSendResponse: async context => {
          const requestEndDate = Date.now();
          metrics.recordRequestDuration(requestEndDate - requestStartDate, context);
        }
      };
    }
  };
};

const { pipelineBuilder } = require('../../utils/pipeline')

function applyPublishMiddleware(pubsub, ...middleware) {
  const oldPublish = pubsub.publish.bind(pubsub)
  const publishPipeline = pipelineBuilder()
    .use(...middleware)
    .build()

  pubsub.publish = function (triggerName, payload) {
    return publishPipeline({ message: payload, clientTopic: triggerName }, () => oldPublish(triggerName, payload))
  }

  return pubsub
}

module.exports = applyPublishMiddleware

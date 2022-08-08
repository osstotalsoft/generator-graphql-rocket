const { pipelineBuilder } = require('../../utils/pipeline')

function applyPublishMiddleware(pubSub, ...middleware) {
  const oldPublish = pubSub.publish.bind(pubSub)
  const publishPipeline = pipelineBuilder()
    .use(...middleware)
    .build()

  pubSub.publish = function (triggerName, payload) {
    return publishPipeline({ message: payload, clientTopic: triggerName }, () => oldPublish(triggerName, payload))
  }

  return pubSub
}

module.exports = applyPublishMiddleware

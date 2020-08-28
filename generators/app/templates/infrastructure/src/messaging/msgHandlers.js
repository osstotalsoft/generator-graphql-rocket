const messagingHost = require("@totalsoft/messaging-host")
const someOtherMessageHandlers = {}

const handlers = messagingHost.dispatcher.mergeHandlers([someOtherMessageHandlers])

module.exports = handlers
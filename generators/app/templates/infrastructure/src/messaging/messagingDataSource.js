const { DataSource } = require("apollo-datasource")
const messageBus = require("@totalsoft/message-bus")

class MessagingDataSource extends DataSource {
    constructor() {
        super()

        this.context
    }

    initialize(config) {
        const ctx = config.context
        this.context = {
            <%_ if(withMultiTenancy){ _%>
            tenantId: ctx.tenant && ctx.tenant.externalId,
            <%_}_%>
            correlationId: ctx.correlationId
        }
    }

    publish(topic, msg) {
        return messageBus.publish(topic, msg, this.context)
    }

    subscribe(topic, handler, opts) {
        return messageBus.subscribe(topic, handler, opts)
    }

    sendCommandAndReceiveEvent(topic, command, events) {
        return messageBus.sendCommandAndReceiveEvent(topic, command, events, this.context)
    }
}

module.exports = MessagingDataSource
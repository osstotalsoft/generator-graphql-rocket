const { DataSource } = require("apollo-datasource")
const { messageBus } = require("@totalsoft/message-bus")

class MessagingDataSource extends DataSource {
    constructor() {
        super()

        this.context
        this.msgBus
    }

    initialize(config) {
        const ctx = config.context
        this.context = {
            <%_ if(dataLayer == "knex" && withMultiTenancy){ _%>
            tenantId: ctx.tenant && ctx.tenant.externalId,
            <%_}_%>
            correlationId: ctx.correlationId
        }
        this.msgBus = messageBus()
}

publish(topic, msg) {
    return this.msgBus.publish(topic, msg, this.context)
}

subscribe(topic, handler, opts) {
    return this.msgBus.subscribe(topic, handler, opts)
}

sendCommandAndReceiveEvent(topic, command, events) {
    return this.msgBus.sendCommandAndReceiveEvent(topic, command, events, this.context)
}
}

module.exports = MessagingDataSource
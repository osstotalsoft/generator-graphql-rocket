const { DataSource } = require('apollo-datasource')
const { messageBus } = require('@totalsoft/message-bus')

class MessagingDataSource extends DataSource {
  constructor() {
    super()

    this.context
    this.envelopeCustomizer
    this.msgBus
  }
  initialize(config) {
    const ctx = config.context
    this.context = {
        <%_ if(withMultiTenancy){ _%>
        tenantId: ctx.externalTenantId,
        <%_}_%> 
        correlationId: ctx.correlationId,
        token: ctx.token,
        userId: ctx.externalUser?.id
    }
    this.envelopeCustomizer = headers => ({ ...headers, UserId: this.context.UserId })
    this.msgBus = messageBus()
  }

  publish(topic, msg) {
    return this.msgBus.publish(topic, msg, this.context, headers => ({
      ...headers,
      userId: this.context.UserId
    }))
  }

  subscribe(topic, handler, opts) {
    return this.msgBus.subscribe(topic, handler, opts)
  }

  sendCommandAndReceiveEvent(topic, command, events) {
    return this.msgBus.sendCommandAndReceiveEvent(topic, command, events, this.context, this.envelopeCustomizer)
  }
}

module.exports = MessagingDataSource

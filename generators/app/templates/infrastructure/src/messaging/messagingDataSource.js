const { DataSource } = require('apollo-datasource')
const { messageBus } = require('@totalsoft/message-bus')
<%_ if(withMultiTenancy){ _%>
  const { tenantContextAccessor } = require("../multiTenancy");
  const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')
<%_}_%>

<%_ if(addTracing){ _%>
const { tracingPublish } = require("./middleware");
<%_}_%>
const { concat, run, pipelineBuilder } = require("../utils/pipeline");
const { correlationManager } = require("../correlation");

const publishPipeline = pipelineBuilder().use(<%if(addTracing){%>tracingPublish()<%}%>).build();

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
        tenantId: isMultiTenant ? tenantContextAccessor.getTenantContext().tenant?.id : undefined,
        <%_}_%>
        correlationId: correlationManager.getCorrelationId(),
        token: ctx.token,
        externalUser: ctx.externalUser
    }
    this.envelopeCustomizer = headers => ({ ...headers, UserId: this.context.externalUser.id })
    this.msgBus = messageBus()
  }

  publish(topic, msg) {
    const pipeline = concat(
      (ctx, _next) => this.msgBus.publish(topic, msg, this.context, ctx.envelopeCustomizer),
      publishPipeline
    );

    return run(pipeline, { envelopeCustomizer: this.envelopeCustomizer, topic });
  }

  subscribe(topic, handler, opts) {
    return this.msgBus.subscribe(topic, handler, opts)
  }

  sendCommandAndReceiveEvent(topic, command, events) {
    const pipeline = concat(
      (ctx, _next) =>
        this.msgBus.sendCommandAndReceiveEvent(topic, command, events, this.context, ctx.envelopeCustomizer),
      publishPipeline
    );

    return run(pipeline, { envelopeCustomizer: this.envelopeCustomizer, topic });
  }
}

module.exports = MessagingDataSource

const applyPublishMiddleware = require ('./applyPublishMiddleware')
const { correlationPublish } = require('./correlationPublish')
<%_ if(addTracing) {_%>
const { tracingPublish } = require('./tracingPublish')
<%_}_%>
<%_ if(withMultiTenancy) {_%>
const { tenantPublish } = require('./tenantPublish')
<%_}_%>

module.exports = {
  applyPublishMiddleware,
  correlationPublish,
  <%_ if(withMultiTenancy) {_%>
  tenantPublish,
  <%_}_%>
  <%_ if(addTracing) {_%>
  tracingPublish
  <%_}_%>
}

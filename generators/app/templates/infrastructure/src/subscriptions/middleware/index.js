const { correlation } = require('./correlation')
<%_ if(addTracing) {_%>
const { tracing } = require('./tracing')
<%_}_%>
<%_ if(withMultiTenancy) {_%>
const { tenantContext } = require('./tenantContext')
<%_}_%>

module.exports = {
  correlation,
  <%_ if(addTracing) {_%>
  tracing,
  <%_}_%
  <%_ if(withMultiTenancy) {_%>
  tenantContext
  <%_}_%>
}

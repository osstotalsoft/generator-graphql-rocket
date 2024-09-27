const correlation = require("./correlation");
<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./multiTenancy/tenantIdentification")
<%_}_%>
<%_ if(addTracing){ _%>
const { tracing, tracingPublish } = require("./tracing")
<%_}_%>

module.exports = { <% if(withMultiTenancy){ %>tenantIdentification, <%}%>correlation,<% if(addTracing){ %> tracing, tracingPublish <%}%>}

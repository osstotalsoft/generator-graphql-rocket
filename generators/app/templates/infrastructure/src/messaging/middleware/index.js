const dbInstance = require("./dbInstance")
<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./multiTenancy/tenantIdentification")
<%_}_%>
<%_ if(addTracing){ _%>
const tracing = require("./tracing")
<%_}_%>

module.exports = { <% if(withMultiTenancy){ %>tenantIdentification, <%}%>dbInstance<% if(addTracing){ %>, tracing <%}%>}
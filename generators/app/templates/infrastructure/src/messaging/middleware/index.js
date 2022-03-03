<%_ if(dataLayer == "knex") {_%>
const dbInstance = require("./dbInstance")
<%_}_%>
<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./multiTenancy/tenantIdentification")
<%_}_%>
<%_ if(addTracing){ _%>
const tracing = require("./tracing")
<%_}_%>

module.exports = { <% if(withMultiTenancy){ %>tenantIdentification, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%><% if(addTracing){ %> tracing <%}%>}
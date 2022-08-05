const correlation = require("./correlation");
<%_ if(dataLayer == "knex") {_%>
const dbInstance = require("./dbInstance")
<%_}_%>
<%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./multiTenancy/tenantIdentification")
<%_}_%>
<%_ if(addTracing){ _%>
const { tracing, tracingPublish } = require("./tracing")
<%_}_%>

module.exports = { <% if(withMultiTenancy){ %>tenantIdentification, <%}%><% if(dataLayer == "knex") {%>dbInstance,<%}%> correlation,<% if(addTracing){ %> tracing, tracingPublish <%}%>}

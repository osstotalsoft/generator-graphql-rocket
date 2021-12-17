<%_ if(dataLayer == "knex") {_%>
const dbInstance = require("./dbInstance")
    <%_ if(withMultiTenancy){ _%>
const tenantIdentification = require("./multiTenancy/tenantIdentification")
    <%_}_%>
<%_}_%>
<%_ if(addTracing){ _%>
const tracing = require("./tracing")
<%_}_%>

module.exports = { <% if(dataLayer == "knex") {%><% if(withMultiTenancy){ %>tenantIdentification, <%}%>dbInstance,<%}%><% if(addTracing){ %> tracing <%}%>}
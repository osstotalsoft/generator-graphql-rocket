const tenantFactory = require("./tenantFactory")
<%_if(dataLayer == "prisma"){ _%>
const tenantManager = require('./tenantManager')
<%_}_%>
<%_if(addQuickStart){ _%>
const tenantConfiguration = require("./tenantConfiguration")
<%_}_%>

module.exports = { <%if(dataLayer == "prisma") {%>...tenantManager,<%}%> tenantFactory <%_if(addQuickStart){ _%>, tenantConfiguration <%}%>}

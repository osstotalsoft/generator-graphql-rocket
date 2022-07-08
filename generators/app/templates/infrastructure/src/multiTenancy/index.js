<%_if(dataLayer == "prisma"){ _%>
const tenantManager = require('./tenantManager')
module.exports = {...tenantManager}
<%_}_%>


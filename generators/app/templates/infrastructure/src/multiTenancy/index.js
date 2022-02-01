const tenantService = require("./tenantService")
<%_if(addQuickStart){ _%>
const tenantModule = require("./tenantModule")

module.exports = { tenantService, tenantModule }
<%_}else{_%>
module.exports = { tenantService }
<%_}_%>

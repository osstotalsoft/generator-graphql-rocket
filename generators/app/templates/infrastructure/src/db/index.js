<%_ if(withMultiTenancy){ _%>
const tenantDbInstanceFactory = require("./multiTenancy/tenantDbInstanceFactory")

module.exports = { tenantDbInstanceFactory }
<%_ } else { _%>
const dbInstanceFactory = require("./dbInstanceFactory")

module.exports = { dbInstanceFactory }
<%_}_%>
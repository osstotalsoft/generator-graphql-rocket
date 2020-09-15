<%_ if(withMultiTenancy){ _%>
const dbInstanceFactory = require("./multiTenancy/tenantDbInstanceFactory")
<%_ } else { _%>
const dbInstanceFactory = require("./dbInstanceFactory")
<%_}_%>

module.exports = { dbInstanceFactory }
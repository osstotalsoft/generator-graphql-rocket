
<%_if(addQuickStart){ _%>
const { getUserDataLoaders } = require("../features/user/dataLoaders");
<%_ if(withMultiTenancy){ _%>
const { getTenantDataLoaders } = require("../features/tenant/dataLoaders");
<%_}_%>

module.exports = dbInstance => ({
  ...getUserDataLoaders(dbInstance)<% if(withMultiTenancy){ %>,
  ...getTenantDataLoaders(dbInstance)
  <%_}_%>
});
<%_} else {_%>
module.exports = _dbInstance => ({})
<%_}_%>

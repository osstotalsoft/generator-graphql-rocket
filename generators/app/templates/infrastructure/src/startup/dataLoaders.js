
const { getUserDataLoaders } = require("../features/user/dataLoaders");
<%_ if(withMultiTenancy){ _%>
const { getTenantDataLoaders } = require("../features/tenant/dataLoaders");
<%_}_%>

module.exports = dbInstance => ({
  ...getUserDataLoaders(dbInstance)<% if(withMultiTenancy){ %>,
  ...getTenantDataLoaders(dbInstance)
  <%_}_%>
});

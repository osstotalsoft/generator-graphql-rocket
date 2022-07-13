
<%_if(addQuickStart){ _%>
const { getUserDataLoaders } = require("../features/user/dataLoaders");

module.exports = dbInstance => ({
  ...getUserDataLoaders(dbInstance)<% if(withMultiTenancy){ %>,
  <%_}_%>
});
<%_} else {_%>
module.exports = _dbInstance => ({})
<%_}_%>

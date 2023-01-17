<%_if(addQuickStart){ _%>
const UserApi = require('../features/user/dataSources/userApi');
<%_ if(dataLayer == "knex") {_%>
const UserDb = require('../features/user/dataSources/userDb');
<%_}_%>
<%_ if(withMultiTenancy){ _%>
const TenantIdentityApi = require('../features/tenant/dataSources/tenantIdentityApi');
<%_}_%>
<%_}_%>

module.exports.getDataSources = context => ({
// Instantiate your data sources here. e.g.: userApi: new UserApi()
<%_if(addQuickStart){ _%>
    userApi: new UserApi(context)
    <%_ if(dataLayer == "knex") {_%>,
    userDb: new UserDb(context)
    <%_}_%>
    <%_ if(withMultiTenancy){ _%>,
    tenantIdentityApi: new TenantIdentityApi(context)
    <%_}_%>
<%_}_%>
})

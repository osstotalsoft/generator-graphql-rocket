<%_if(addQuickStart){ _%>
const UserApi = require('../features/user/dataSources/userApi');
<%_ if(withMultiTenancy){ _%>
const TenantIdentityApi = require('../features/tenant/dataSources/tenantIdentityApi');
<%_}_%>
<%_}_%>

module.exports.getDataSources = context => ({
// Instantiate your data sources here. e.g.: userApi: new UserApi(context)
<%_if(addQuickStart){ _%>
    userApi: new UserApi(context)
    <%_ if(withMultiTenancy){ _%>,
    tenantIdentityApi: new TenantIdentityApi(context)
    <%_}_%>
<%_}_%>
})

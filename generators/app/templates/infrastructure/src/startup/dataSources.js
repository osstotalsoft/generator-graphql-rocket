const UserApi = require('../features/user/dataSources/userApi');
const UserDb = require('../features/user/dataSources/userDb');
<%_ if(withMultiTenancy){ _%>
const TenantIdentityApi = require('../features/tenant/dataSources/tenantIdentityApi');
<%_}_%>

module.exports.getDataSources = () => ({
    userApi: new UserApi(),
    userDb: new UserDb()<% if(withMultiTenancy){ %>,
    tenantIdentityApi: new TenantIdentityApi()
    <%_}_%>
})

// This is a temporary fix to pass dataSources to ws requests. This will be fixed in Apollo server v3.0
module.exports.initializedDataSources = (context, dbInstance, dataSources) => {
    ds.userApi.initialize({ context })
    ds.userDb.initialize({ context: { dbInstance } })
    <%_ if(withMultiTenancy){ _%>
    ds.tenantIdentityApi.initialize({ context })
    <%_}_%>
    return ds
}
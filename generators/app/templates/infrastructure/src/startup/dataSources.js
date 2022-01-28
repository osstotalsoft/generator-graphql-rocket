<%_if(addQuickStart){ _%>
const UserApi = require('../features/user/dataSources/userApi');
<%_ if(dataLayer == "knex") {_%>
const UserDb = require('../features/user/dataSources/userDb');
    <%_ if(withMultiTenancy){ _%>
const TenantIdentityApi = require('../features/tenant/dataSources/tenantIdentityApi');
    <%_}_%>
<%_}_%>
<%_}_%>

module.exports.getDataSources = () => ({
// Instantiate your data sources here. e.g.: userApi: new UserApi()
<%_if(addQuickStart){ _%>
    userApi: new UserApi(),
    <%_ if(dataLayer == "knex") {_%>
    userDb: new UserDb()
        <%_ if(withMultiTenancy){ _%>,
    tenantIdentityApi: new TenantIdentityApi()
        <%_}_%>
    <%_}_%>
<%_}_%>
})

// This is a temporary fix to pass dataSources to ws requests. This will be fixed in Apollo server v3.0
module.exports.initializedDataSources = (context <% if(dataLayer == "knex") {%>, dbInstance<%}%>, dataSources) => {
// You need to initialize you datasources here e.g.: dataSources.userApi.initialize({ context })
<%_if(addQuickStart){ _%>
    dataSources.userApi.initialize({ context })
    <%_ if(dataLayer == "knex") {_%>
    dataSources.userDb.initialize({ context: { dbInstance } })
        <%_ if(withMultiTenancy){ _%>
    dataSources.tenantIdentityApi.initialize({ context })
        <%_}_%>
    <%_}_%>
<%_}_%>
return dataSources
}

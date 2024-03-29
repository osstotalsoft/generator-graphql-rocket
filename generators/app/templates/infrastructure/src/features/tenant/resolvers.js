const { tenantService } = require('@totalsoft/multitenancy-core')
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || 'false')

const tenantResolvers = {
    Query: {
        myTenants: async (_parent, _params, { dataSources }) => {
            if (!isMultiTenant)
              return []

            const tenants = await dataSources.tenantIdentityApi.getTenants()
            return tenants
        }
    },
    IdentityTenant: {
        tenant: async ({ tenantId }) => await tenantService.getTenantFromId(tenantId)
    }
}

module.exports = tenantResolvers;

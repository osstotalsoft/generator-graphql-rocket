const tenantResolvers = {
    Query: {
        myTenants: async (_parent, _params, { dataSources }) => {
            const tenants = await dataSources.tenantIdentityApi.getTenants()
            return tenants.map(({ tenantId, ...rest }) => ({ externalId: tenantId, ...rest }))
        }
    },
    ExternalTenant: {
        tenant: async ({ externalId }, _params, { dataLoaders }) => {
            const tenants = await dataLoaders.tenantByExternalId.load(externalId)
            return tenants
        }
    }
}

module.exports = tenantResolvers;
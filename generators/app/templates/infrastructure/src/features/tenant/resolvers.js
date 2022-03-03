<%_ if(dataLayer == "prisma") {_%>
    const { pascalizeKeys } = require('humps')
    const { prisma } = require('../../prisma')
<%_}_%>

const tenantResolvers = {
    Query: {
        myTenants: async (_parent, _params, { dataSources }) => {
            const tenants = await dataSources.tenantIdentityApi.getTenants()
            return tenants.map(({ tenantId, ...rest }) => ({ externalId: tenantId, ...rest }))
        }
    },
    ExternalTenant: {
        <%_ if(dataLayer == "knex") {_%>
        tenant: ({ externalId }, _params, { dataLoaders }) => dataLoaders.tenantByExternalId.load(externalId)
        <%_}_%>
        <%_ if(dataLayer == "prisma") {_%>
        tenant: ({ externalId }, _params, _ctx) => prisma().tenant.findUnique({ where: { ExternalId: externalId } })
        <%_}_%>
    }
}

module.exports = tenantResolvers;
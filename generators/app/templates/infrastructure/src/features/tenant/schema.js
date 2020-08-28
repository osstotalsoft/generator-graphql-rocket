const { gql } = require("apollo-server-koa");

const tenantTypeDefs = gql`
type Tenant {
    id: ID!
    name: String!
    code: String!
}

type ExternalTenant {
    externalId: ID!
    name: String
    code: String
    tier: String
    isActive: Boolean
    tenant: Tenant
}
extend type Query {
    myTenants: [ExternalTenant!]!
}
`;

module.exports = tenantTypeDefs;

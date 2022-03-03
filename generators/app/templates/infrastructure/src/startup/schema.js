const { makeExecutableSchema } = require('@graphql-tools/schema')
const merge = require('lodash.merge');

const { loadTypedefsSync } = require('@graphql-tools/load')
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader')
const { join } = require('path')
<%_ if(withRights || (dataLayer === "prisma" && withMultiTenancy)){ _%>
const { applyMiddleware } = require('graphql-middleware')
<%_}_%>
<%_ if(dataLayer === "prisma" && withMultiTenancy){ _%>
const { tenantIdentification } = require('./middleware/tenantIdentification')
<%_}_%>
<%_ if(withRights){ _%>
const { permissionsMiddleware } = require('../middleware/permissions/index')
<%_}_%>

<%_if(addQuickStart){ _%>
const userResolvers = require('../features/user/resolvers');

<%_ if(withMultiTenancy){ _%>
const tenantResolvers = require('../features/tenant/resolvers');
<%_}_%>
<%_}_%>

const oldTypeDefs = []
const sources = loadTypedefsSync(join(__dirname, '../**/*.graphql'), {
  loaders: [new GraphQLFileLoader()]
})

<%_if(addQuickStart){ _%>
const resolvers = merge(userResolvers<% if(withMultiTenancy){ %>, tenantResolvers<%}%>)
<%_} else { _%>
const resolvers = merge(/* Your resolvers here*/)
<%_}_%>

const typeDefs = [...sources.map(source => source.document), ...oldTypeDefs]

<%_ if(withRights || (dataLayer === "prisma" && withMultiTenancy)){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), <% if(withRights){ %>permissionsMiddleware<%}%><% if(dataLayer === "prisma" && withMultiTenancy){ %>, tenantIdentification<%}%>);
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs, resolvers }

const { makeExecutableSchema } = require('apollo-server-koa')
const merge = require('lodash.merge');

const { loadTypedefsSync } = require('@graphql-tools/load')
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader')
const { join } = require('path')
<%_ if(withRights){ _%>
const { applyMiddleware } = require('graphql-middleware')
const { permissionsMiddleware } = require('../middleware/permissions/index')
<%_}_%>

const userResolvers = require('../features/user/resolvers');

<%_ if(withMultiTenancy){ _%>
const tenantResolvers = require('../features/tenant/resolvers');
<%_}_%>

const typeDefs = []
const sources = loadTypedefsSync(join(__dirname, '../**/*.graphql'), {
  loaders: [new GraphQLFileLoader()]
})
const resolvers = merge(userResolvers<% if(withMultiTenancy){ %>, tenantResolvers<%}%>)

const mergedTypeDefs = [...sources.map(source => source.document), ...typeDefs]

<%_ if(withRights){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs: mergedTypeDefs, resolvers }), permissionsMiddleware);
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs: mergedTypeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs: mergedTypeDefs, resolvers }

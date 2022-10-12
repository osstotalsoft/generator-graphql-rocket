const { makeExecutableSchema } = require('@graphql-tools/schema')
const merge = require('lodash.merge');

const { loadTypedefsSync } = require('@graphql-tools/load'),
  { loadFilesSync } = require('@graphql-tools/load-files'),
  { mergeResolvers } = require('@graphql-tools/merge'),
  { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader'),
  { join } = require('path')

<%_ if(withRights || (dataLayer === "prisma" && withMultiTenancy)){ _%>
const { applyMiddleware } = require('graphql-middleware')
<%_}_%>

<%_ if(withRights){ _%>
const { permissionsMiddleware } = require('../middleware/permissions/index')
<%_}_%>


const sources = loadTypedefsSync(join(__dirname, '../**/*.graphql'), {
  loaders: [new GraphQLFileLoader()]
})
const typeDefs = sources.map(source => source.document)
const resolvers = mergeResolvers(loadFilesSync(join(__dirname, '../**/resolvers.{js,ts}')))

<%_ if(withRights || (dataLayer === "prisma" && withMultiTenancy)){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers })<% if(withRights){ %>, permissionsMiddleware<%}%>);
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs, resolvers }

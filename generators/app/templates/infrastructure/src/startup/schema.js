const { makeExecutableSchema } = require('@graphql-tools/schema')

const { loadTypedefsSync } = require('@graphql-tools/load'),
  { loadFilesSync } = require('@graphql-tools/load-files'),
  { mergeResolvers } = require('@graphql-tools/merge'),
  { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader'),
  { join } = require('path')

<%_ if(withRights){ _%>
const { applyMiddleware } = require('graphql-middleware'),
 { permissionsMiddleware } = require('../middleware/permissions/index')
<%_}_%>


const sources = loadTypedefsSync(join(__dirname, '../**/*.graphql'), {
  loaders: [new GraphQLFileLoader()]
})
const typeDefs = sources.map(source => source.document)
const resolvers = mergeResolvers(loadFilesSync(join(__dirname, '../**/*resolvers.{js,ts}'), { globOptions: { caseSensitiveMatch: false } }))

<%_ if(withRights){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissionsMiddleware)
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs, resolvers }
module.exports.resolvers = resolvers;



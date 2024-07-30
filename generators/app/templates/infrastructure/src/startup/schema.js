const { makeExecutableSchema } = require('@graphql-tools/schema'),
  { loadFilesSync } = require('@graphql-tools/load-files'),
  { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge'),
  { join } = require('path')

<%_ if(withRights){ _%>
const { applyMiddleware } = require('graphql-middleware'),
 { permissionsMiddleware } = require('../middleware')
<%_}_%>


const typeDefs = mergeTypeDefs(loadFilesSync(join(__dirname, '../**/*.graphql')))
const resolvers = mergeResolvers(loadFilesSync(join(__dirname, '../**/*resolvers.{js,ts}')), {
  globOptions: { caseSensitiveMatch: false }
})

<%_ if(withRights){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissionsMiddleware)
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs, resolvers }



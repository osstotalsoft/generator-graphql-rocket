const { makeExecutableSchema } = require('apollo-server-koa')
const merge = require('lodash.merge');
<%_ if(withRights){ _%>
const { applyMiddleware } = require('graphql-middleware')
const { permissionsMiddleware } = require('../middleware/permissions/index')
<%_}_%>

const rootTypeDefs = require('../features/common/rootSchema');
const paginationTypeDefs = require('../features/common/paginationSchema');

const userTypeDefs = require('../features/user/schema');
const userResolvers = require('../features/user/resolvers');

<%_ if(withMultiTenancy){ _%>
const tenantTypeDefs = require('../features/tenant/schema');
const tenantResolvers = require('../features/tenant/resolvers');
<%_}_%>

const typeDefs = [rootTypeDefs, paginationTypeDefs, userTypeDefs<% if(withMultiTenancy){ %>, tenantTypeDefs<%}%>]
const resolvers = merge(userResolvers<% if(withMultiTenancy){ %>, tenantResolvers<%}%>)

<%_ if(withRights){ _%>
module.exports = applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissionsMiddleware);
<%_} else { _%>
module.exports = makeExecutableSchema({ typeDefs, resolvers });
<%_}_%>
module.exports.tests = { typeDefs, resolvers }

<%_if(addQuickStart){ _%>
const { shield, and } = require('graphql-shield')
const { isAuthenticated, isAdmin } = require('./rules')
const { GraphQLError } = require('graphql')

const permissionsMiddleware = shield({
    User: {
        rights: isAuthenticated
    },
    Query: {
        userList: isAuthenticated
    },
    Mutation: {
        updateUser: and(isAuthenticated, isAdmin)
    }
},
    {
        debug: true,
        allowExternalErrors: true,
        fallbackError: (_thrownThing, _parent, _args, _context, info) => {
            return new GraphQLError(`You are not authorized to execute this operation! [operation name: "${info.operation.name.value || ''}, field: ${info.fieldName}"]`, { extensions: { code:'ERR_INTERNAL_SERVER' }} )
        },
    })

module.exports = { permissionsMiddleware }
<%_}else{_%>
const { shield } = require('graphql-shield')
// Apply shield rules on your schema (see docs https://github.com/maticzav/graphql-shield)
const permissionsMiddleware = shield({})
module.exports = { permissionsMiddleware }
<%_}_%>
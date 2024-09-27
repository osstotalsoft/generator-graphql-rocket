// Define your shield rules using graphql-shield (see docs https://github.com/maticzav/graphql-shield)
<%_if(addQuickStart){ _%>
const { rule } = require('graphql-shield')
const { includes, intersection } = require('ramda')
const { admin, globalAdmin } = require('../../constants/identityUserRoles')
const { viewDashboard } = require('../../constants/permissions')
const { GraphQLError } = require('graphql')
const { prisma } = require('../../prisma')
// strict - use when rule relies on parent or args parameter as well (field specific modifications)
// Cannot use STRICT caching for upload types

const isAuthenticated = rule({ cache: 'contextual' })(
    (_parent, _args, context) => !!context?.externalUser?.id
)

const isAdmin = rule({ cache: 'contextual' })(
    (_parent, _args, { externalUser }, _info) => includes(admin, externalUser.role) || includes(globalAdmin, externalUser.role)
)

const canViewDashboard = rule({ cache: 'contextual' })(
    (_parent, _args, context, _info) => checkForPermission([viewDashboard], context)
)

const checkForPermission = async (permissions, { externalUser }) => {
    try {
      const rights = (
        await prisma().user.findFirst({ where: { ExternalId: externalUser?.id } }).UserRights({ include: { Right: true } })
      )?.map(x => x?.right?.name)
  
      return intersection(permissions, rights).length > 0
    } catch (error) {
      throw new GraphQLError(`Authorization check failed! The following error was encountered: ${error}`)
    }
}


module.exports = {
    isAuthenticated, isAdmin, canViewDashboard
}
<%_}_%>
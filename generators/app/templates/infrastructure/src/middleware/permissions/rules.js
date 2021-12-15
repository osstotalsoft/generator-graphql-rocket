const { rule } = require('graphql-shield')
const { includes, intersection } = require('ramda');
const { admin, globalAdmin } = require('../../constants/identityUserRoles')
const { viewDashboard } = require('../../constants/permissions')
const { ForbiddenError } = require('apollo-server-koa');
<%_ if(dataLayer == "prisma") {_%>
const prisma = require('../../utils/prisma')
<%_}_%>

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

<%_ if(dataLayer == "knex") {_%>
const checkForPermission = async (permissions, { dbInstance, externalUser }) => {
    try {
        const { id } = await dbInstance.select("Id").from("User").where("ExternalId", externalUser.id).first()
        const rights = await dbInstance.select("Name as Right").from("UserRight")
            .join('[Right]', { 'Right.Id': 'RightId' })
            .where("UserRight.UserId", id)

        return intersection(permissions, rights.map(x => x.right)).length > 0
    }
    catch (error) {
        throw new ForbiddenError(`Authorization check failed! The following error was encountered: ${error}`)
    }
}
<%_} else if(dataLayer == "prisma") {_%>
const checkForPermission = async (permissions, { externalUser }) => {
    try {
      const rights = (
        await prisma.user.findFirst({ where: { ExternalId: externalUser?.id } }).UserRights({ include: { Right: true } })
      )?.map(x => x?.right?.name)
  
      return intersection(permissions, rights).length > 0
    } catch (error) {
      throw new ForbiddenError(`Authorization check failed! The following error was encountered: ${error}`)
    }
}
<%_}_%>


module.exports = {
    isAuthenticated, isAdmin, canViewDashboard
}
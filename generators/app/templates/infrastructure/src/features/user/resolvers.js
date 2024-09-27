<%_ if(addSubscriptions){ _%>
const { topics, pubSub } = require('../../pubSub')
<%_}_%>
<%_ if(addSubscriptions && withMultiTenancy){ _%>
const { envelope } = require("@totalsoft/message-bus")
const { withFilter } = require('graphql-subscriptions')
<%_}_%>
const { prisma, prismaPaginated } = require('../../prisma')

const userResolvers = {
    Query: {
        userData: (_, { id }, _ctx, _info) => prisma().user.findUnique({ where: { id } }),
        userList: (_parent, { pager, filters }, _ctx) => 
            prismaPaginated(prisma().user, pager, { where: { name: { contains: filters?.name } } })
    },
    User: {
        rights: async ({ id }, _params, _ctx, _info) => {
          const userRights = await prisma().userRight.findUnique({
            where: { userId: id },
            include: { right: true }
          })
          return userRights.map(r => r?.right?.name)
        }
    },
    //Not working! Only for demonstration
    Mutation: {
        updateUser: async (_, { input }, _ctx, _info) => {
            const { id } = input
            return prisma().user.update({ data: input, where: { id } })
        }
    },
    <%_ if(addSubscriptions){ _%>
    //Not working! Only for demonstration
    Subscription: {
        userChanged: {
            resolve: async (msg, _variables, _context, _info) => {
                return msg.payload
            },
            <%_ if(withMultiTenancy){ _%>
            subscribe: withFilter(
                (_parent, _args, _context) => pubSub.asyncIterator(topics.USER_CHANGED),
                (message, _params, { tenant, logger }, _info) => {
                    logger.logInfo(`📨   Message received from ${topics.USER_CHANGED}: ${JSON.stringify(message)}`, '[Message_Received]', true);
                    logger.logInfo(`📨   Message tenant id =  ${envelope.getTenantId(message).toUpperCase()}; Context tenant id = ${tenant?.id?.toUpperCase()}`,
                        '[Message_Tenant_Check]', true);
                    return envelope.getTenantId(message).toUpperCase() === tenant?.id?.toUpperCase()
                }
            )
            <%_} else { _%>
            subscribe: (_parent, _args, _context) => pubSub.asyncIterator(topics.USER_CHANGED)
            <%_}_%>
        }
    }
    <%_}_%>
}

module.exports = userResolvers

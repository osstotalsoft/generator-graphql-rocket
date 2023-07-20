<%_ if(addSubscriptions){ _%>
const { topics, pubSub } = require('../../pubSub')
<%_}_%>
<%_ if(addSubscriptions && withMultiTenancy){ _%>
const { envelope } = require("@totalsoft/message-bus")
const { withFilter } = require('graphql-subscriptions')
<%_}_%>
<%_ if(dataLayer == "prisma") {_%>
const { prisma, prismaPaginated } = require('../../prisma')
<%_}_%>

const userResolvers = {
    <%_ if(dataLayer == "knex") {_%>
    Query: {
        userData: async (_, { id, externalId }, { dataLoaders }, _info) => {
            if (externalId) {
                return await dataLoaders.userByExternalId.load(externalId);
            } else return await dataLoaders.userById.load(id);
        },
        userList: async (_parent, { pager, filters }, { dataSources }) => {
            const { pageSize } = pager;
            const data = await dataSources.userDb.getUserList(pager, filters);
            const { values, sortByValue } = data;
            return pageSize ? { values: values.slice(0, pageSize), nextAfterId: values[pageSize], sortByValue } : { values, sortByValue }
        }
    },
    User: {
        rights: async ({ id }, _params, { dataLoaders }, _info) => {
            // to avoid n+1 problem, use dataLoader whenever you can
            const userRights = await dataLoaders.userRightsByUserId.load(id);
            const rightsIds = userRights && userRights.map(ur => ur.rightId)
            const rights = await dataLoaders.userRightsById.loadMany(rightsIds || [])
            return rights.map(r => r.name)
        }
    },
    UserList: {
        pagination: async ({ nextAfterId, sortByValue }, { pager, filters }, { dataSources }, _info) => {
            const { totalCount } = await dataSources.userDb.getUserListTotalCount(filters);
            const prevPageId = await dataSources.userDb.getUserListPreviousPageAfterId(pager, filters, sortByValue);
            const prevPage = { ...pager, afterId: prevPageId && prevPageId.id };
            const nextPage = { ...pager, afterId: nextAfterId ? nextAfterId.id : null };
            return { totalCount, prevPage, nextPage };
        }
    },
    //Not working! Only for demonstration
    Mutation: {
        updateUser: async (_, { input }, { dataSources }, _info) => {
            return dataSources.userApi.updateUser(input);
        }
    },
    <%_} else if(dataLayer == "prisma"){_%>
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
    <%_}_%>
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

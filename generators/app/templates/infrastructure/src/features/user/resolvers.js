<%_ if(addSubscriptions){ _%>
const { topics, redisPubSub } = require('../../pubSub')
<%_}_%>
<%_ if(addSubscriptions && withMultiTenancy){ _%>
const { envelope } = require("@totalsoft/message-bus")
const { withFilter } = require('graphql-subscriptions');
<%_}_%>

const userResolvers = {
    Query: {
        userData: async (_, { id, externalId }, { dataLoaders }) => {
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
        rights: async ({ id }, _params, { dataLoaders }) => {
            // to avoid n+1 problem, use dataLoader whenever you can
            const userRights = await dataLoaders.userRightsByUserId.load(id);
            const rightsIds = userRights && userRights.map(ur => ur.rightId)
            const rights = await dataLoaders.userRightsById.loadMany(rightsIds || [])
            return rights.map(r => r.name)
        }
    },
    UserList: {
        pagination: async ({ nextAfterId, sortByValue }, { pager, filters }, { dataSources }) => {
            const { totalCount } = await dataSources.userDb.getUserListTotalCount(filters);
            const prevPageId = await dataSources.userDb.getUserListPreviousPageAfterId(pager, filters, sortByValue);
            const prevPage = { ...pager, afterId: prevPageId && prevPageId.id };
            const nextPage = { ...pager, afterId: nextAfterId ? nextAfterId.id : null };
            return { totalCount, prevPage, nextPage };
        }
    },
    //Not working! Only for demonstration
    Mutation: {
        updateUser: async (_, { input }, { dataSources }) => {
            return dataSources.userApi.updateUser(input);
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
                (_parent, _args, _context) => redisPubSub.asyncIterator(topics.USER_CHANGED),
                (message, _params, { tenant, logger }, _info) => {
                    logger.logInfo(`📨   Message received from ${topics.USER_CHANGED}: ${JSON.stringify(message)}`, '[Message_Received]', true);
                    logger.logInfo(`📨   Message tenant id =  ${envelope.getTenantId(message).toUpperCase()}; Context tenant id = ${tenant.externalId.toUpperCase()}`,
                        '[Message_Tenant_Check]', true);
                    return envelope.getTenantId(message).toUpperCase() === tenant.externalId.toUpperCase()
                }                
            )
            <%_} else { _%>
            subscribe: (_parent, _args, _context) => redisPubSub.asyncIterator(topics.USER_CHANGED)
            <%_}_%>
        }
    }
    <%_}_%>
};

module.exports = userResolvers;

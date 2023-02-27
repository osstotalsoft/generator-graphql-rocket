const { startApolloServer } = require('./apollo')
<%_ if(addMessaging) { _%>
const startMsgHost = require('./messaging')
<%_ } _%>
<%_ if(addSubscriptions){ _%>
const startSubscriptionServer = require('./subscription')
<%_ } _%>

module.exports = { startApolloServer<% if(addMessaging) { %>, startMsgHost <% } %> <% if(addSubscriptions){ %>, startSubscriptionServer <% } %>}

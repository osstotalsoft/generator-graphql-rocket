// Inner GraphQL event topics, events that are published in Redis
const topics = {
<%_if(addQuickStart){ _%>
    USER_CHANGED: "GQL.Notification.UserChanged"
<%_}_%>
}

module.exports = topics;
const { RedisPubSub } = require('graphql-redis-subscriptions')
const { PubSub } = require('graphql-subscriptions');
const RedisClient = require('ioredis');
const { REDIS_DOMAIN_NAME, REDIS_PORT_NUMBER } = process.env;
const { applyPublishMiddleware, correlationPublish<% if(withMultiTenancy) {%>, tenantPublish<%}%><% if(addTracing) {%>, tracingPublish<%}%> } = require('./middleware')

const options = {
  host: REDIS_DOMAIN_NAME,
  port: REDIS_PORT_NUMBER
};

const pubSub = REDIS_DOMAIN_NAME ?
  new RedisPubSub({
    publisher: new RedisClient(options),
    subscriber: new RedisClient(options)
  }) :
  new PubSub()

module.exports = applyPublishMiddleware(pubSub, correlationPublish<% if(withMultiTenancy) {%>, tenantPublish<%}%><% if(addTracing) {%>, tracingPublish<%}%>);

const { RedisPubSub } = require('graphql-redis-subscriptions')
const RedisClient = require('ioredis');
const { PubSub } = require('graphql-subscriptions');
const { REDIS_DOMAIN_NAME, REDIS_PORT_NUMBER } = process.env;

const options = {
    host: REDIS_DOMAIN_NAME,
    port: REDIS_PORT_NUMBER
};

const redisPubSub = REDIS_DOMAIN_NAME ?
    new RedisPubSub({
        publisher: new RedisClient(options),
        subscriber: new RedisClient(options)
    }) :
    new PubSub()

module.exports = redisPubSub;
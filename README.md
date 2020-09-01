# graphql-rocket [![NPM version][npm-image]][npm-url]
>GraphQL server sample with Apollo Server, Koa middleware, database reads using Knex JS, and/or REST API consumer, token validation, messaging integration with Redis and Nats and many other cool features.

![Building blocks](assets/img/appicon.png)

> If you are creating a new web application we recommend you to use our [Webapp Rocket Generator](https://github.com/osstotalsoft/generator-webapp-rocket).
## Installation

First, install [Yeoman](http://yeoman.io) and @totalsoft/generator-graphql-rocket using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g @totalsoft/generator-graphql-rocket
```

Then generate your new GraphQL server:

```bash
yo @totalsoft/graphql-rocket
```

You will be prompted to introduce the following information:
 1. The project name. This will also be the name of the folder in which the new server will live. A valid project name, only includes lower and upper case letters, digits and '-' or '_' separators! No special characters and whitespace are allowed and do not start or end with a separator!
 2. GraphQL port. By default it would be set to `4000`
 3. Include multi-tenancy. By default is set to false.
 4. Use subscriptions. By default is set to false.
 5. Add messaging integration. Option is available only if you choose to add subscriptions. By default is set to false.
 6. Implement authorization. By default is set to false. This includes rights and permissions.
 7. Include GraphQL logging plugin. By default is set to false. This also catches all error and throws an error friendly message. Read more bellow.
 8. Whether to generate default helm files or not.
 9. The name of your helm chart. Provide a valid helm chart name, only use lower case letters, digits and '-' or '_' separators! No special characters and whitespace are allowed and do not start or end with a separator!
 9. Add Opentracing using Jaeger. By default is set to false.
 10. Identity API url, your Identity server API url.
 11. Identity openId configuration.
 12. Identity authority.
 13. What package manager you wish to use to install the application dependencies. (npm or yarn).
 
If you would like to start the application, simply run ``npm start`` in the newly created folder, otherwise you can begin editing and writing your application!

## What is a Generator?
A Yeoman generator is a scaffolding tool. You can use Yeoman to install applications based on templates. This repository is an example of a template - an application with a build, code structure, and dependencies installed and organized for you!

Using a generator accelerates application development. You don't have to worry about best practices for foundational elements, because we've incorporated them. Our template generates a fully functional GraphQL server that becomes the infrastructure of your new project. Before this miracle generator existed, this code would probably took you a few days to write, oh well... now this will be done in only 30 seconds!

Included latest versions of the following libraries and technologies: <b>GraphQL,  [Apollo Server](https://github.com/apollographql/apollo-server), [Koa](https://koajs.com/), [@totalsoft/nodebb](https://github.com/osstotalsoft/nodebb), [graphql/dataloader](https://github.com/graphql/dataloader), [knex.js](https://knexjs.org/), [Redis](https://github.com/luin/ioredis) </b> and many more, see generators/app/templates/infrastructure/package.json file.

## Token validation
This GraphQL server is expecting that all the applications and services that consumes him, uses an Identity server that generates secure jwk authentication tokens. 

Our server defines a middleware  function that decodes the token and validate it against the Identity server on every request using the following libraries:[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) and [jwks-rsa](https://github.com/auth0/node-jwks-rsa). 

## Authorization
When building a service or any other application it is crucial to make it secure, besides token validation, there might be the need to limit access to certain fields, types or even endpoints. We can help you do this too. 

To implement restriction rules we use [graphql-shield](https://github.com/maticzav/graphql-shield). If you answered with `true` to the "Implement authorization" question prompted at the beginning, there will be an example of permission checking included in this sample. (See `src/middleware/permissions`)

In addition, we will include two constant files: `src/contants/identityUserRoles.js` containing the default roles that comes from the Identity server and `src/contants/permissions.js` that contains your defined application roles.

To define a new role, assuming it was already added in the database, you should export it from `src/constants/permissions` file.

By default the permission check is made by checking the `UserRight` table (This function can me replace and changes as desired):

``` 
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
```

To implement restrictions you first have to define your rules and them apply them in the "shield" defined on top of your GraphQL schema.
e.g.: 
```
const isAuthenticated = rule({ cache: 'contextual' })(
    (_parent, _args, context) => !!context.externalUser.id
)

const isAdmin = rule({ cache: 'contextual' })(
    (_parent, _args, { externalUser }, _info) => includes(admin, externalUser.role) || includes(globalAdmin, externalUser.role)
)

shield({
    User: {
        rights: isAuthenticated
    },
    Query: {
        userList: isAuthenticated
    },
    Mutation: {
        updateUser: and(isAuthenticated, isAdmin)
    }
})
```

## Multi-tenancy
If you need to handle multi-tenancy in your new application, you can just reply with `yes` when you are being prompted about this topic at the beginning and voilà! Everything will be done for you.

This feature comes with	a middleware function that identitfies the tenant on every request using different strategies. By default it first looks for the tenantId in the query string ( `request.query.tenantId` ), if not there then we'll decode the token and try to extrat it from there. You can use other strategies of tenant identification, we also included some you can choose from or you can define your own.

```
const tenantIdentification = () => async (ctx, next) => {
    if (!ctx.tenant) {
        const tenantId = R.ifElse(
            getTenantIdFromQueryString,
            getTenantIdFromJwt
        )(ctx)

        ctx.tenant = await tenantService.getTenantFromId(tenantId);
    }
    await next();
}

const getTenantIdFromJwt = ({ token }) => {
    let tenantId = null;
    if (token) {
        const decoded = jsonwebtoken.decode(token.replace("Bearer ", ""));
        if (decoded) {
            tenantId = decoded.tid;
        }
    }
    return tenantId;
}
const getTenantIdFromQueryString = ({ request }) => request.query.tenantId

const getTenantIdFromHeaders = ctx => ctx.req.headers.tenantid

const getTenantIdFromHost = ctx => ctx.hostname

const getTenantIdFromRefererHost = async ctx => {
    if (!ctx.request.headers.referer) {
        return;
    }
    var url = new URL.parse(ctx.request.headers.referer);
    return url.hostname
};
```

In addition, when choosing this option, you will find a `src/features/tenant` folder. This contains the infrastructure (query, resolvers, dataLoaders and api functions) you can use to manage multi-tenancy in your frontent application. This is the missing piece for the **Tenant Selector** component, a part of the [Webapp Rocket Generator -> Multy-tenancy](https://github.com/osstotalsoft/generator-webapp-rocket#multi-tenancy).

## Subscriptions

By default allows you to handle subscriptions in you GraphQL server using Redis or in-memory ([pubSub implementations](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#pubsub-implementations)). 
To learn how to handle subscriptions in your GraphQL server see [Apollo Server documentation](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#subscriptions-example).

## Messaging

In some cases you may need to handle external events in you GraphQL server. To do this, our template integrates with [@totalsoft/nodebb](https://github.com/osstotalsoft/nodebb), allowing you to handle events published in a message bus using Nats, Kafka, etc. For more details see its documentation.

This feature will include the `src/messaging` folder, which contains all the things you need to develope your first ervent handler.

1. First, you need to define the event topic you want to listen by exporting it as a string from `src/messaging/topics.js` file.
2. Write the message handler itself, you cand cerate it in your feature folder and add it in the `src/messaging/msgHandlers.js` file.
3. (Optional) `MessagingDataSource` - this allows you to define a custom Apollo data source that helps you explicitly publish or subscribe to events on the message bus.

Being a totally different context, we would have to apply all the middleware functions and strategies that are normally executed on a basic GraphQL request. To to so, in your `src/index.js` file you fill see the following code:
```
messagingHost()
    .subscribe([
        topics.USER_PHONE_CHANGED,
        topics.USER_EMAIL_CHANGED
    ])
    .use(exceptionHandling())
    .use(correlation())
    .use(middleware.tracing())
    .use(middleware.tenantIdentification())
    .use(middleware.dbInstance())
    .use(dispatcher(msgHandlers))
    .start()
```
This code basically executes the same middleware functions in the same order as they are executed on a GraphQL request. 

## Error logging

This features includes a logging plugin, that helps you monitor the execution of your GraphQL operations with the use of the request life cycle events. Read  more about Apollo Server plugins here: [Plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/)

By default all the logs are saved in the application database ( this can be changed by modifying the `saveLogs()` method found in `src/plugins/logging/loggingUtils.js` file. 

In addition, the errors thrown inside Apollo Server, are wrapped in a 'user friendly message'. This helps you not to leak sensitive data from unauthorized users.

## OpenTracing

Microservice Architecture has now become the obvious choice for application developers, but how can you debug and monitor a set of interdependent distributed services? Here comes OpenTracing to help us. This generator, includes an OpenTracing integration using Jaeger, helping you monitor all the components of your GraphQL server ( SQL, Knex statements, GraphQL request lifecycle both Http and WebSocket and of course traces requests and events handled in your messaging handlers.

This feature includes a tracing middleware you can find in `src/middleware/tracing`, a plugin that traces GraphQL requests located at `src/plugins/tracing` and the `src/tracing` folder includes utils files and also the knex/sql tracing implementation. 

In addition, to activate this option, you will need to make a few configuration in server's `.env` file:

```
JAEGER_SERVICE_NAME=<%= projectName %>
JAEGER_AGENT_HOST=
JAEGER_AGENT_PORT=
JAEGER_SAMPLER_TYPE=const
JAEGER_SAMPLER_PARAM=1
JAEGER_DISABLED=true
```
## Code examples

To help you out starting developing a feature in your new server, we included some code samples ( see `src/features/user`). This code's purpose is not only to help you wrap you head around SDL and GraphQL development in general, but it also comes with the queries and data needed to implement authorization in your web application, the missing part from [Webapp Rocket Generator -> Authorization ](https://github.com/osstotalsoft/generator-webapp-rocket#authorization).
 
## Deployment
When you are ready you can deploy you application on any platform. This template also includes a pre-configured Dockerfile and optional Helm files.

## Getting To Know Yeoman
 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).

## License

MIT

[npm-image]: https://badge.fury.io/js/%40totalsoft%2Fgenerator-graphql-rocket.svg
[npm-url]: https://www.npmjs.com/package/@totalsoft/generator-graphql-rocket

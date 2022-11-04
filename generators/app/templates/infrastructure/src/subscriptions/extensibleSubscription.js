const { isAsyncIterable } = require("graphql/jsutils/isAsyncIterable");
const { mapAsyncIterator } = require("graphql/execution/mapAsyncIterator");
const { execute, createSourceEventStream, GraphQLError } = require("graphql");
const { pipelineBuilder } = require("../utils/pipeline");

function subscribe({ middleware, filter }) {
  const pipeline = pipelineBuilder()
    .use(...middleware)
    .build();

  return function (
    argsOrSchema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    subscribeFieldResolver
  ) {
    return arguments.length === 1
      ? subscribeImpl(argsOrSchema, pipeline, filter)
      : subscribeImpl(
          {
            schema: argsOrSchema,
            document,
            rootValue,
            contextValue,
            variableValues,
            operationName,
            fieldResolver,
            subscribeFieldResolver
          },
          pipeline,
          filter
        );
  };
}

function filterAsyncIterable(asyncIterable, predicate) {
  return {
    async next() {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const item = await asyncIterable.next();
        if (item.done) {
          return { done: true };
        }
        if (predicate(item.value)) {
          return item;
        }
      }
    },
    return(val) { return asyncIterable.return(val) },
    throw() { return asyncIterable.throw() },
    [Symbol.asyncIterator]() { return this }
  }
}

function subscribeImpl(args, pipeline, filter) {
  const {
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    subscribeFieldResolver
  } = args

  const sourcePromise = createSourceEventStream(
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    subscribeFieldResolver
  );

  // For each payload yielded from a subscription, map it over the normal
  // GraphQL `execute` function, with `payload` as the rootValue.
  // This implements the "MapSourceToResponseEvent" algorithm described in
  // the GraphQL specification. The `execute` function provides the
  // "ExecuteSubscriptionEvent" algorithm, as it is nearly identical to the
  // "ExecuteQuery" algorithm, for which `execute` is also used.
  const mapSourceToResponse = async function mapSourceToResponse(payload) {
    return pipeline({ message: payload, context: contextValue }, () =>
      execute({
        schema,
        document,
        rootValue: payload,
        contextValue,
        variableValues,
        operationName,
        fieldResolver
      })
    );
  };

  return sourcePromise.then(function (resultOrStream) {
    return isAsyncIterable(resultOrStream)
      ? mapAsyncIterator(
          filter ? filterAsyncIterable(resultOrStream, filter(contextValue)) : resultOrStream,
          mapSourceToResponse
        )
      : resultOrStream;
  });
}

module.exports = { subscribe };

const { default: isAsyncIterable } = require("graphql/jsutils/isAsyncIterable");
const { default: mapAsyncIterator } = require("graphql/subscription/mapAsyncIterator");
const { execute, createSourceEventStream, GraphQLError } = require("graphql");
const { pipelineBuilder } = require("../../utils/pipeline");

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
            document: document,
            rootValue: rootValue,
            contextValue: contextValue,
            variableValues: variableValues,
            operationName: operationName,
            fieldResolver: fieldResolver,
            subscribeFieldResolver: subscribeFieldResolver
          },
          pipeline,
          filter
        );
  };
}
/**
 * This function checks if the error is a GraphQLError. If it is, report it as
 * an ExecutionResult, containing only errors and no data. Otherwise treat the
 * error as a system-class error and re-throw it.
 */

function reportGraphQLError(error) {
  if (error instanceof GraphQLError) {
    return {
      errors: [error]
    };
  }

  throw error;
}

function filterAsyncIterable(asyncIterable, predicate) {
  return (async function* () {
    for await (const item of asyncIterable) {
      if (predicate(item)) {
        yield item;
      }
    }
  })();
}

function subscribeImpl(args, pipeline, filter) {
  var schema = args.schema,
    document = args.document,
    rootValue = args.rootValue,
    contextValue = args.contextValue,
    variableValues = args.variableValues,
    operationName = args.operationName,
    fieldResolver = args.fieldResolver,
    subscribeFieldResolver = args.subscribeFieldResolver;
  var sourcePromise = createSourceEventStream(
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
  var mapSourceToResponse = async function mapSourceToResponse(payload) {
    return pipeline({ message: payload, context: contextValue }, () =>
      execute({
        schema: schema,
        document: document,
        rootValue: payload,
        contextValue: contextValue,
        variableValues: variableValues,
        operationName: operationName,
        fieldResolver: fieldResolver
      })
    );
  };

  return sourcePromise.then(function (resultOrStream) {
    return isAsyncIterable(resultOrStream)
      ? mapAsyncIterator(
          filter ? filterAsyncIterable(resultOrStream, filter(contextValue)) : resultOrStream,
          mapSourceToResponse,
          reportGraphQLError
        )
      : resultOrStream;
  });
}

module.exports = { subscribe };

const { getExternalSpan, traceError, traceErrors } = require("../../tracing/tracingUtils");
const SpanContext = require("./spanContext");

const alwaysTrue = () => true;
const emptyFunction = () => { };

function getFieldName(info) {
    if (
        info.fieldNodes &&
        info.fieldNodes.length > 0 &&
        info.fieldNodes[0].alias
    ) {
        return info.fieldNodes[0].alias.value;
    }

    return info.fieldName || "field";
}

module.exports = ({
    tracer,
    shouldTraceRequest = alwaysTrue,
    shouldTraceFieldResolver = alwaysTrue,
    onRequestResolving = emptyFunction,
    onRequestResolved = emptyFunction,
    onFieldResolving = emptyFunction,
    onFieldResolved = emptyFunction
}) => {
    return {
        requestDidStart(requestInfo) {
            const { request, context } = requestInfo;

            if (!shouldTraceRequest(requestInfo)) {
                return;
            }

            const activeSpan = context.requestSpan || getExternalSpan(tracer, request)
            const rootSpan =
                tracer.startSpan("request " + request.operationName, {
                    childOf: activeSpan || undefined,
                });

            onRequestResolving(rootSpan, requestInfo);

            return {
                parsingDidStart(_requestContext) {
                    const parseSpan = tracer.startSpan("parse", {
                        childOf: rootSpan
                    });
                    return (error) => {
                        traceError(parseSpan, error)
                        parseSpan.finish()
                    }
                },
                validationDidStart(_requestContext) {
                    const validationSpan = tracer.startSpan("validation", {
                        childOf: rootSpan
                    });
                    return (errors) => {
                        traceErrors(validationSpan, errors)
                        validationSpan.finish()
                    }
                },
                executionDidStart(_requestContext) {
                    const executionSpan = tracer.startSpan("execution", {
                        childOf: rootSpan
                    });
                    const spanContext = SpanContext()
                    return ({
                        willResolveField(fieldContext) {
                            const { info } = fieldContext
                            if (!shouldTraceFieldResolver(fieldContext) ||
                                (info.path && info.path.prev && !spanContext.getSpanByPath(info.path.prev))) {
                                return
                            }

                            const parentSpan = info.path && info.path.prev
                                ? spanContext.getSpanByPath(info.path.prev)
                                : executionSpan;

                            const resolveFieldSpan = tracer.startSpan("resolve " + getFieldName(info), {
                                childOf: parentSpan
                            });

                            spanContext.addSpan(resolveFieldSpan, info);
                            onFieldResolving(fieldContext);
                            return (error, result) => {
                                onFieldResolved(error, result, resolveFieldSpan);
                                traceError(resolveFieldSpan, error)
                                resolveFieldSpan.finish()
                            };
                        },
                        executionDidEnd(error) {
                            traceError(executionSpan, error)
                            executionSpan.finish()
                        }
                    })
                },
                didResolveSource({ request }) {
                    rootSpan.log({ event: 'didResolveSource', operation: request.operationName });
                },
                didResolveOperation({ request }) {
                    rootSpan.log({ event: 'didResolveOperation', operation: request.operationName });
                },
                responseForOperation({ request }) {
                    rootSpan.log({ event: 'responseForOperation', operation: request.operationName });
                },
                didEncounterErrors: async ({ errors, ..._requestContext }) => {
                    traceErrors(rootSpan, errors, false)
                },
                willSendResponse: async ({ context: _requestContext, response }) => {
                    onRequestResolved(rootSpan, response)
                    rootSpan.finish();
                }
            }
        }
    }
}
const { getExternalSpan, traceError, traceErrors } = require('@totalsoft/opentracing');
const SpanContext = require("./spanContext");
const opentracing = require("opentracing");

const alwaysTrue = () => true;
const emptyFunction = () => { };
const componentName = "gql-apollo";

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
            const requestSpan =
                tracer.startSpan("request " + request.operationName, {
                    childOf: activeSpan || undefined,
                });
            requestSpan.setTag(opentracing.Tags.COMPONENT, componentName);

            onRequestResolving(requestSpan, requestInfo);

            return {
                parsingDidStart(_requestContext) {
                    const parseSpan = tracer.startSpan("parse", {
                        childOf: requestSpan
                    });
                    parseSpan.setTag(opentracing.Tags.COMPONENT, componentName);

                    return (error) => {
                        traceError(parseSpan, error)
                        parseSpan.finish()
                    }
                },
                validationDidStart(_requestContext) {
                    const validationSpan = tracer.startSpan("validation", {
                        childOf: requestSpan
                    });
                    validationSpan.setTag(opentracing.Tags.COMPONENT, componentName);

                    return (errors) => {
                        traceErrors(validationSpan, errors)
                        validationSpan.finish()
                    }
                },
                executionDidStart(_requestContext) {
                    const executionSpan = tracer.startSpan("execution", {
                        childOf: requestSpan
                    });
                    executionSpan.setTag(opentracing.Tags.COMPONENT, componentName);

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
                            resolveFieldSpan.setTag(opentracing.Tags.COMPONENT, componentName);

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
                    requestSpan.log({ event: 'didResolveSource', operation: request.operationName });
                },
                didResolveOperation({ request }) {
                    requestSpan.log({ event: 'didResolveOperation', operation: request.operationName });
                },
                responseForOperation({ request }) {
                    requestSpan.log({ event: 'responseForOperation', operation: request.operationName });
                },
                didEncounterErrors: async ({ errors, ..._requestContext }) => {
                    traceErrors(requestSpan, errors, false)
                },
                willSendResponse: async ({ context: _requestContext, response }) => {
                    onRequestResolved(requestSpan, response)
                    requestSpan.finish();
                }
            }
        }
    }
}

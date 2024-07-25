const opentelemetry = require("@opentelemetry/sdk-node");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { OTEL_SERVICE_NAME, OTEL_TRACE_PROXY } = process.env;
const { JaegerPropagator } = require("@opentelemetry/propagator-jaeger");
<%_ if(addSubscriptions) {_%>
const { WSInstrumentation } = require("@totalsoft/opentelemetry-instrumentation-ws");
<%_} _%>
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')
const { ParentBasedSampler, AlwaysOnSampler } = require('@opentelemetry/sdk-trace-node')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino')
const { IORedisInstrumentation } = require('@opentelemetry/instrumentation-ioredis')
const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql')
const { context, trace } = require('@opentelemetry/api')
const { getRPCMetadata, RPCType } = require('@opentelemetry/core')
const instrumentation = require('@opentelemetry/instrumentation')
<%_ if(dataLayer == 'prisma') {_%>
const { PrismaInstrumentation }  = require("@prisma/instrumentation");
<%_}_%>

const otelTraceProxy = JSON.parse(OTEL_TRACE_PROXY || 'false')

class CustomGraphQLInstrumentation extends GraphQLInstrumentation {
  init() {
    const module = new instrumentation.InstrumentationNodeModuleDefinition('graphql', ['>=14'])
    module.files.push(this._addPatchingExecute())
    return module
  }
}

const isGraphQLRoute = url => url?.startsWith('/graphql')
const isTelemetryRoute = url => url?.startsWith('/metrics') || url?.startsWith('/livez') || url?.startsWith('/readyz')

// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
const traceExporter = new OTLPTraceExporter()
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: OTEL_SERVICE_NAME
  }),
  sampler: new ParentBasedSampler({ root: new AlwaysOnSampler() }),
  traceExporter,
  textMapPropagator: new JaegerPropagator(),
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: r =>
        r.method == 'OPTIONS' || (otelTraceProxy ? isTelemetryRoute(r.url) : !isGraphQLRoute(r.url)),
      ignoreOutgoingRequestHook: _ => !trace.getSpan(context.active()), // ignore outgoing requests without parent span
      startOutgoingSpanHook: r => ({ [SemanticAttributes.PEER_SERVICE]: r.host || r.hostname })
    }),
    new CustomGraphQLInstrumentation({
      ignoreTrivialResolveSpans: true,
      mergeItems: true,
      responseHook: (span, _) => {
        const rpcMetadata = getRPCMetadata(context.active())

        if (rpcMetadata?.type === RPCType.HTTP) {
          rpcMetadata?.span?.updateName(`${rpcMetadata?.span?.name} ${span.name}`)
        }
      }
    }),
    new PinoInstrumentation(),
    new IORedisInstrumentation(),
    <%_ if(addSubscriptions) {_%>
    new WSInstrumentation(),
    <%_} _%>
    <%_ if(dataLayer == 'prisma') {_%>
    new PrismaInstrumentation()
    <%_}_%>
  ]
});


function start({ logger = console } = {}) {
  // initialize the SDK and register with the OpenTelemetry API
  // this enables the API to record telemetry
  try {
    sdk.start()
    logger.info('Tracing initialized')
  } catch (error) {
    logger.error(error, 'Error initializing tracing')
  }
}

function shutdown({ logger = console } = {}) {
  return sdk
    .shutdown()
    .then(() => logger.info("Tracing terminated"))
    .catch(error => logger.error(error, "Error terminating tracing"));
}

module.exports = { start, shutdown };

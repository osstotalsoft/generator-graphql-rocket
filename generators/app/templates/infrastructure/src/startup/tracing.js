const opentelemetry = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { OTEL_EXPORTER_JAEGER_SERVICE_NAME } = process.env;
const { JaegerPropagator } = require("@opentelemetry/propagator-jaeger");
const { WSInstrumentation } = require("@totalsoft/opentelemetry-instrumentation-ws");
const { SemanticAttributes } = require("@opentelemetry/semantic-conventions");
<%_ if(dataLayer == 'prisma') {_%>
const { PrismaInstrumentation }  = require("@prisma/instrumentation");
<%_}_%>

// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
const traceExporter = new JaegerExporter();
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: OTEL_EXPORTER_JAEGER_SERVICE_NAME
  }),
  traceExporter,
  textMapPropagator: new JaegerPropagator(),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-koa": { ignoreLayersType: ["middleware"] },
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-graphql": { ignoreTrivialResolveSpans: true, mergeItems: true },
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-dataloader": { enabled: false },
      "@opentelemetry/instrumentation-tedious": { enabled: false },
      "@opentelemetry/instrumentation-grpc": { enabled: false },
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: r => r.method == "OPTIONS",
        startOutgoingSpanHook: r => ({ [SemanticAttributes.PEER_SERVICE]: r.host || r.hostname })
      }
    }),
    new WSInstrumentation(),
    <%_ if(dataLayer == 'prisma') {_%>
    new PrismaInstrumentation()
    <%_}_%>
  ]
});

function start({ logger = console } = {}) {
  // initialize the SDK and register with the OpenTelemetry API
  // this enables the API to record telemetry
  return sdk
    .start()
    .then(() => logger.info("Tracing initialized"))
    .catch(error => logger.error(error, "Error initializing tracing"));
}

function shutdown({ logger = console } = {}) {
  return sdk
    .shutdown()
    .then(() => logger.info("Tracing terminated"))
    .catch(error => logger.error(error, "Error terminating tracing"));
}

module.exports = { start, shutdown };

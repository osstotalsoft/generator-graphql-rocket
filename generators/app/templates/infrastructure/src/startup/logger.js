<%_ if(withMultiTenancy) {_%>
const { tenantIdMixin, tenantCodeMixin } = require("@totalsoft/pino-multitenancy");
const isMultiTenant = JSON.parse(process.env.IS_MULTITENANT || "false");
<%_}_%>
const { correlationMixin } = require("@totalsoft/pino-correlation");
<%_ if(addTracing) {_%>
const { openTelemetryTracingTransport } = require("@totalsoft/pino-opentelemetry");
<%_}_%>

// General settings
const { LOG_MIN_LEVEL } = process.env,
  logMinLevel = LOG_MIN_LEVEL || "info";

// DB transport settings
const { LOG_DATABASE, LOG_DATABASE_MINLEVEL, LOG_DATABASE_ENABLED } = process.env,
  logDatabaseEnabled = JSON.parse(LOG_DATABASE_ENABLED || "false"),
  logDatabaseMinLevel = LOG_DATABASE_MINLEVEL || "info";

<%_ if(addTracing) {_%>
// OpenTracing transport settings
const { LOG_OPENTELEMETRY_TRACING_ENABLED, LOG_OPENTELEMETRY_TRACING_MINLEVEL, JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED),
  logOpenTelemetryTracingEnabled = tracingEnabled && JSON.parse(LOG_OPENTELEMETRY_TRACING_ENABLED || "false"),
  logOpenTelemetryTracingMinLevel = LOG_OPENTELEMETRY_TRACING_MINLEVEL || "info";
<%_}_%>

const pino = require("pino");

const options = {
  level: logMinLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin(_context, _level) {
    return { ...correlationMixin()<% if(withMultiTenancy) {%>, ...tenantIdMixin(), ...tenantCodeMixin()<%}%> };
  }
};
const transport = pino.transport({
  targets: [
    ...(logDatabaseEnabled
      ? [
          {
            target: "@totalsoft/pino-mssqlserver",
            options: {
              serviceName: "<%= projectName %>",
              tableName: "__Logs",
              connectionString: LOG_DATABASE
            },
            level: logDatabaseMinLevel
          }
        ]
      : []),
    {
      target: "pino-pretty",
      options: {
        ignore: "pid,hostname,correlationId,tenantId,tenantCode,requestId,operationName,trace_id,span_id,trace_flags",
        translateTime: 'SYS:yyyy/mm/dd HH:MM:ss.l',
        <%_ if(withMultiTenancy) {_%>
        messageFormat: isMultiTenant ? "[{tenantCode}] {msg}" : false
        <%_}_%>
      },
      level: "trace"
    }
  ]
});

<%_ if(addTracing) { _%>
var streams = pino.multistream([
  { stream: transport, level: "trace" },
  ...(logOpenTelemetryTracingEnabled ? [{ stream: openTelemetryTracingTransport(), level: logOpenTelemetryTracingMinLevel }] : [])
]);

const logger = pino(options, streams);
<%_} else {_%>
const logger = pino(options, transport);
<%_}_%>

module.exports = logger;

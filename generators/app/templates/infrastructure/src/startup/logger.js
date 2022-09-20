<%_ if(withMultiTenancy) {_%>
const { tenantIdMixin } = require("@totalsoft/pino-multitenancy");
<%_}_%>
const { correlationMixin } = require("@totalsoft/pino-correlation");
<%_ if(addTracing) {_%>
const { opentracingTransport } = require("@totalsoft/pino-opentracing");
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
const { LOG_OPENTRACING_ENABLED, LOG_OPENTRACING_MINLEVEL, JAEGER_DISABLED } = process.env,
  tracingEnabled = !JSON.parse(JAEGER_DISABLED),
  logOpenTracingEnabled = tracingEnabled && JSON.parse(LOG_OPENTRACING_ENABLED || "false"),
  logOpenTracingMinLevel = LOG_OPENTRACING_MINLEVEL || "info";
<%_}_%>

const pino = require("pino");

const options = {
  level: logMinLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin(_context, _level) {
    return { ...correlationMixin()<% if(withMultiTenancy) {%>, ...tenantIdMixin()<%}%> };
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
        ignore: "pid,hostname,correlationId,tenantId,requestId,operationName"
      },
      level: "trace"
    }
  ]
});

<%_ if(addTracing) { _%>
var streams = pino.multistream([
  { stream: transport, level: "trace" },
  ...(logOpenTracingEnabled ? [{ stream: opentracingTransport(), level: logOpenTracingMinLevel }] : [])
]);

const logger = pino(options, streams);
<%_} else {_%>
const logger = pino(options, transport);
<%_}_%>

module.exports = logger;

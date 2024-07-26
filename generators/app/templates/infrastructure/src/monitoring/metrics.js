const { MeterProvider, View, ExplicitBucketHistogramAggregation, InstrumentType } = require('@opentelemetry/sdk-metrics')
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')
const { metrics, ValueType } = require('@opentelemetry/api')

const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;

const exporter = new PrometheusExporter({ preventServerStart: true });

const meterProvider = new MeterProvider({
    readers: [exporter],
    views: [
      new View({
        instrumentType: InstrumentType.HISTOGRAM,
        instrumentUnit: 'seconds',
        aggregation: new ExplicitBucketHistogramAggregation([
          0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10
        ])
      }),
      new View({
        instrumentType: InstrumentType.HISTOGRAM,
        instrumentUnit: 'milliseconds',
        aggregation: new ExplicitBucketHistogramAggregation([
          5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000
        ])
      })
    ]
})
metrics.setGlobalMeterProvider(meterProvider)
  
const meter = meterProvider.getMeter('node/memory-usage')

meter.createObservableGauge('nodejs_rss', {
    description: 'Resident Set Size',
}, (observableResult) => {
    observableResult.observe(process.memoryUsage.rss(), {});
});

meter.createObservableGauge('nodejs_heapTotal', {
    description: 'Total heap size',
}, (observableResult) => {
    observableResult.observe(process.memoryUsage().heapTotal, {});
});

meter.createObservableGauge('nodejs_heapUsed', {
    description: 'Heap used',
}, (observableResult) => {
    observableResult.observe(process.memoryUsage().heapUsed, {});
});

meter.createObservableGauge('nodejs_external', {
    description: 'External',
}, (observableResult) => {
    observableResult.observe(process.memoryUsage().external, {});
});

meter.createObservableGauge('nodejs_arrayBuffer', {
    description: 'Array Buffer',
}, (observableResult) => {
    observableResult.observe(process.memoryUsage().arrayBuffers, {});
});

const requestStarted =
    meter.createCounter('gql_request_started', { description: 'The number of received requests.' });

const requestFailed =
    meter.createCounter('gql_request_failed', { description: 'The number of failed requests.' });

const requestDuration = meter.createHistogram('gql_request_duration', {
    description: 'The total duration of a request (in ms).',
    unit: 'milliseconds',
    valueType: ValueType.INT
})
const requestDurationSeconds = meter.createHistogram('gql_request_duration_seconds', {
    description: 'The total duration of a request (in seconds).',
    unit: 'seconds',
    valueType: ValueType.DOUBLE
})
      

const subscriptionStarted =
    meter.createCounter('gql_subscription_started', { description: 'The number of subscriptions.' });

async function startServer(logger) {
    await exporter.startServer();
    logger.info(
        `🚀 Metrics server ready at http://localhost:${port}${endpoint}`,
    );
}

function _getLabelsFromContext(context) {
    return {
        operationName: context?.request?.operationName,
        operationType: context?.operation?.operation
    };
}

function recordRequestStarted(context) {
    const { operationName } = _getLabelsFromContext(context)
    requestStarted.add(1, { operationName });
}

function recordRequestFailed(context) {
    requestFailed.add(1, _getLabelsFromContext(context));
}

function recordRequestDuration(duration, context) {
    requestDuration.record(duration, {
        ..._getLabelsFromContext(context),
        success: (context.errors?.length ?? 0) === 0 ? 'true' : 'false'
    });
    
    requestDurationSeconds.record(duration / 1000, {
        ..._getLabelsFromContext(context),
        success: (context.errors?.length ?? 0) === 0 ? 'true' : 'false'
    })
}

function recordSubscriptionStarted(context, message) {
    subscriptionStarted.add(1, {
        operationName: message?.payload?.operationName,
        operationType: message?.type
    });
}

module.exports = {
    startServer,
    recordRequestDuration,
    recordRequestStarted,
    recordRequestFailed,
    recordSubscriptionStarted
}

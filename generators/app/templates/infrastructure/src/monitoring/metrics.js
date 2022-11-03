const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;

const exporter = new PrometheusExporter({ preventServerStart: true });

const meter = new MeterProvider({
    exporter,
    interval: 1000,
}).getMeter('node/memory-usage');

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

const requestDuration =
    meter.createHistogram('gql_request_duration', {
        description: 'The total duration of a request (in ms).',
        boundaries: [10, 100, 1000, 10000, 100000],
    });

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

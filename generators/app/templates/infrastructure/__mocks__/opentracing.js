const opentracing = jest.genMockFromModule('opentracing');

opentracing.globalTracer = jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue({
        log: jest.fn(),
        setTag: jest.fn(),
        finish: jest.fn()
    }),
    finish: jest.fn()
});

module.exports = opentracing;

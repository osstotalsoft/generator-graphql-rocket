const opentracing = jest.createMockFromModule('opentracing');

opentracing.globalTracer = jest.fn().mockReturnValue({
    startSpan: jest.fn().mockReturnValue({
        log: jest.fn(),
        setTag: jest.fn(),
        finish: jest.fn()
    }),
    finish: jest.fn(),
    extract: jest.fn()
});

module.exports = opentracing;

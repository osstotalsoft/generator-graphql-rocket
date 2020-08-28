
function isArrayPath(path) {
    return typeof path.key === "number";
}

function buildPath(path) {
    let current = path;
    const segments = [];
    while (current != null) {
        if (isArrayPath(current)) {
            segments.push(`[${current.key}]`);
        } else {
            segments.push(current.key);
        }
        current = current.prev;
    }
    return segments.reverse().join(".");
}

function SpanContext() {
    const spans = new Map();

    return {
        getSpanByPath(path) {
            return spans.get(buildPath(isArrayPath(path) ? path.prev : path));
        },
        addSpan(span, info) {
            spans.set(buildPath(info.path), span);
        }
    }
}

module.exports = SpanContext
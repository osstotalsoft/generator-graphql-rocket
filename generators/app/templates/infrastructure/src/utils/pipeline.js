function empty(ctx, next) {
  return next();
}

function emptyFn() {}

function concat(middleware, pipeline) {
  return (ctx, next) => pipeline(ctx, () => middleware(ctx, next));
}

function run(pipeline, ctx) {
  return pipeline(ctx, emptyFn);
}

function pipelineBuilder() {
  let pipeline = empty;

  function use(...middleware) {
    pipeline = middleware.reduce((p, m) => concat(m, p), pipeline);
    return this;
  }

  function build() {
    return pipeline;
  }

  return { use, build };
}

module.exports = { empty, concat, run, pipelineBuilder };

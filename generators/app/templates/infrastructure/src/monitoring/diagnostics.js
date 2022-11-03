const Koa = require("koa");
const v8 = require("v8");
const numeral = require("numeral");
const R = require("ramda");

const routerCfg = {
  "/": index,
  "/heap-dump": heapDump,
  "/memory-usage": memoryUsage
};

const app = new Koa();
app.use(async (ctx, next) => {
  const routeHandler = routerCfg[ctx.request.path.toLowerCase()];
  if (routeHandler) {
    routeHandler(ctx);
  } else {
    await next();
  }
});

function heapDump(ctx) {
  ctx.body = v8.getHeapSnapshot();
  const fileName = `${Date.now()}.heapsnapshot`;
  ctx.attachment(fileName);
}

function memoryUsage(ctx) {
  const res = R.mapObjIndexed(num => numeral(num).format("0.0 b"), process.memoryUsage());
  ctx.body = res;
}

function index(ctx) {
  const bodyContent = Object.keys(routerCfg)
    .map(path => `<a href="${path}">${path}</a>`)
    .join("</br>");
  const html = `<html><body>${bodyContent}</body></html>`;

  ctx.body = html;
}

const port = process.env.DIAGNOSTICS_PORT || 4001;
function startServer(logger) {
  app.listen(port);
  logger.info(`🚀 Diagnostics server ready at http://localhost:${port}/`);
}

module.exports = {
  startServer
};

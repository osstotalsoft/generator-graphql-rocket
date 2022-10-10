const errorHandlingMiddleware = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {

    ctx.logger.error(err)

    // will only respond with JSON
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      type: err.type,
      status: ctx.status,
      message: err.message,
      detail: err.stack
    };
  }
};

module.exports = errorHandlingMiddleware

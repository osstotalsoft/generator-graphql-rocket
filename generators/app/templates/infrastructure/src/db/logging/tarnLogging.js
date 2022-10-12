require("colors");

const message = (eventId, resource) =>
  `${eventId} available resource: ${resource.available} healthy: ${resource.healthy} knexUid: ${resource.__knexUid}`;
module.exports.initializeTarnLogging = (pool, { logger = console } = {}) => {
  // resource is acquired from pool
  pool.on("acquireRequest", eventId => logger.debug(`acquireRequest: ${eventId}`.yellow));
  pool.on("acquireSuccess", (eventId, resource) =>
    logger.debug(`acquireSuccess: ${message(eventId, resource)}`.yellow)
  );
  pool.on("acquireFail", (eventId, err) => logger.debug(`acquireFail: ${eventId} error: ${err}`.red));

  // resource returned to pool
  pool.on("release", resource => logger.debug(`Release succeeded! Available resource: ${resource.available}`.yellow));

  // resource was created and added to the pool
  pool.on("createRequest", eventId => logger.debug(`createRequest: ${eventId}`.yellow));
  pool.on("createSuccess", (eventId, resource) => logger.debug(`createSuccess: ${message(eventId, resource)}`.yellow));
  pool.on("createFail", (eventId, err) => logger.debug(`createFail: ${eventId} error: ${err}`.red));

  // resource is destroyed and evicted from pool
  // resource may or may not be invalid when destroySuccess / destroyFail is called
  pool.on("destroyRequest", (eventId, resource) =>
    logger.debug(`destroyRequest: ${message(eventId, resource)}`.yellow)
  );
  pool.on("destroySuccess", (eventId, resource) =>
    logger.debug(`destroySuccess: ${message(eventId, resource)}`.yellow)
  );
  pool.on("destroyFail", (eventId, resource, err) =>
    logger.debug(`destroyFail:  ${message(eventId, resource)} error: ${err}`.red)
  );

  // when internal reaping event clock is activated / deactivated
  pool.on("startReaping", () => logger.debug(`startReaping`.yellow));
  pool.on("stopReaping", () => logger.debug(`stopReaping`.yellow));

  // pool is destroyed (after poolDestroySuccess all event handlers are also cleared)
  pool.on("poolDestroyRequest", eventId => logger.debug(`poolDestroyRequest: ${eventId}`.yellow));
  pool.on("poolDestroySuccess", eventId => logger.debug(`poolDestroySuccess: ${eventId}`.yellow));
};

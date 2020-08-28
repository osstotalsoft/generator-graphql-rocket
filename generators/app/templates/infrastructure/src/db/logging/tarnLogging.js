require('colors')

const message = (eventId, resource) => `${eventId} available resource: ${resource.available} healthy: ${resource.healthy} knexUid: ${resource.__knexUid}`
module.exports.initializeTarnLogging = (pool) => {
    // resource is acquired from pool
    pool.on('acquireRequest', eventId =>
        console.log(`acquireRequest: ${eventId}`.yellow));
    pool.on('acquireSuccess', (eventId, resource) =>
        console.log(`acquireSuccess: ${message(eventId, resource)}`.yellow));
    pool.on('acquireFail', (eventId, err) =>
        console.log(`acquireFail: ${eventId} error: ${err}`.red));

    // resource returned to pool
    pool.on('release', resource => console.log(`Release succeeded! Available resource: ${resource.available}`.yellow));

    // resource was created and added to the pool
    pool.on('createRequest', eventId =>
        console.log(`createRequest: ${eventId}`.yellow));
    pool.on('createSuccess', (eventId, resource) =>
        console.log(`createSuccess: ${message(eventId, resource)}`.yellow));
    pool.on('createFail', (eventId, err) =>
        console.log(`createFail: ${eventId} error: ${err}`.red));

    // resource is destroyed and evicted from pool
    // resource may or may not be invalid when destroySuccess / destroyFail is called
    pool.on('destroyRequest', (eventId, resource) =>
        console.log(`destroyRequest: ${message(eventId, resource)}`.yellow));
    pool.on('destroySuccess', (eventId, resource) =>
        console.log(`destroySuccess: ${message(eventId, resource)}`.yellow));
    pool.on('destroyFail', (eventId, resource, err) =>
        console.log(`destroyFail:  ${message(eventId, resource)} error: ${err}`.red));

    // when internal reaping event clock is activated / deactivated
    pool.on('startReaping', () => console.log(`startReaping`.yellow));
    pool.on('stopReaping', () => console.log(`stopReaping`.yellow));

    // pool is destroyed (after poolDestroySuccess all event handlers are also cleared)
    pool.on('poolDestroyRequest', eventId => console.log(`poolDestroyRequest: ${eventId}`.yellow));
    pool.on('poolDestroySuccess', eventId => console.log(`poolDestroySuccess: ${eventId}`.yellow));
}
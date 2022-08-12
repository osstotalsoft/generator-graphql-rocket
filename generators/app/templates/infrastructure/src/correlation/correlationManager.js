const { AsyncLocalStorage } = require("async_hooks");
const { v4 } = require("uuid");

const asyncLocalStorage = new AsyncLocalStorage();
const store = new Map();

const getCorrelationId = () => {
  const correlationIdStore = asyncLocalStorage.getStore();
  return correlationIdStore?.get("correlationId");
};

async function useCorrelationId(correlationId, next) {
  return asyncLocalStorage.run(store, async () => {
    store.set("correlationId", correlationId || v4());
    return await next();
  });
}

module.exports = { useCorrelationId, getCorrelationId };

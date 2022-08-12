const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();
const store = new Map();

const getTenantContext = () => {
  const tenantStore = asyncLocalStorage.getStore();
  return tenantStore?.get("tenantContext") ?? {};
};

async function useTenantContext(tenantContext, next) {
  return asyncLocalStorage.run(store, async () => {
    store.set("tenantContext", tenantContext);
    return await next();
  });
}

module.exports = { useTenantContext, getTenantContext };

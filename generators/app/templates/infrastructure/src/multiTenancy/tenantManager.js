const { AsyncLocalStorage } = require('async_hooks')

const asyncLocalStorage = new AsyncLocalStorage()
const store = new Map()

const getTenantContext = () => {
  const tenantStore = asyncLocalStorage.getStore()
  return tenantStore?.get('tenant') ?? {}
}

async function useTenantContext(tenant, next) {
  return asyncLocalStorage.run(store, async () => {
    store.set('tenant', tenant)
    return await next()
  })
}

module.exports = { useTenantContext, getTenantContext }

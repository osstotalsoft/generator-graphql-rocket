const R = require('ramda')

let prismaModels
const TENANT_PROP = 'tenantId'

function tenantFilterExtension(prismaClient, tenantId) {
  if (!prismaModels) prismaModels = prismaClient._runtimeDataModel
  return prismaClient.$extends({
    query: {
      $allModels: {
        async $allOperations(params) {
          const { model, args, query } = params
          const { fields } = prismaModels?.models?.[model] || {}
          const tableHasColumnTenant = R.find(({ name }) => R.equals(name, TENANT_PROP), fields)
          if (tableHasColumnTenant) {
            const enrichedParams = addTenantFilter(params, tenantId)
            return query(enrichedParams?.args)
          }
          return query(args)
        }
      }
    }
  })
}

const addTenantProperty = tenantId => obj => ({ ...obj, tenantId })

const addTenantFilter = (params, tenantId) => {
  const { operation, args } = params
  const fn = addTenantProperty(tenantId)

  return R.cond([
    [R.equals('create'), () => R.assocPath(['args', 'data'], fn(args.data), params)],
    [
      R.equals('createMany'),
      () =>
        R.assocPath(
          ['args', 'data'],

          R.map(item => fn(item), args?.data ?? []),
          params
        )
    ],
    [
      R.equals('upsert'),
      () =>
        R.assocPath(
          ['args'],
          {
            ...args,
            create: args?.create ? fn(args.create) : args?.create,
            where: args?.update ? fn(args.where) : args?.where
          },
          params
        )
    ],
    [R.T, () => R.assocPath(['args', 'where'], fn(args?.where), params)]
  ])(operation)
}

module.exports = {
  tenantFilterExtension
}

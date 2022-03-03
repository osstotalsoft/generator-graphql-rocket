const R = require('ramda')
const set = require('lodash.set')

async function getTablesWithColumn(column, prisma) {
  const data = await prisma.$queryRaw`
    SELECT DISTINCT TABLE_NAME as [table], TABLE_SCHEMA as [schema] 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE COLUMN_NAME = ${column}`
  return data
}

async function getDefaultSchemaAndDbName(prisma) {
  const data = await prisma.$queryRaw`select SCHEMA_NAME() as [schema], DB_NAME() as [db]`
  return [data[0].schema, data[0].db]
}

function decompose(tableName) {
  const components = tableName.split('.').map(x => x.trim().replace('[', '').replace(']', ''))

  if (components.length == 1) {
    return [null, null, components[0]]
  } else if (components.length == 2) {
    return [null, components[0], components[1]]
  } else {
    return components
  }
}

async function buildTableHasColumnPredicate(column, prisma) {
  const [defaultSchema, dbName] = await getDefaultSchemaAndDbName(prisma)
  const tbls = await getTablesWithColumn(column, prisma)

  const entries = R.compose(
    R.map(([k, v]) => [k, new Set(R.map(R.prop('table'), v))]),
    R.toPairs,
    R.groupBy(R.prop('schema'))
  )(tbls)
  const map = new Map(entries)

  return function tableHasColumn(tableName) {
    const [db, _schema, table] = decompose(tableName)
    if (db && db != dbName) {
      return false
    }
    const schema = _schema ?? defaultSchema
    return map.has(schema) && map.get(schema).has(table)
  }
}

const addTenantProperty = tenantId => obj => ({ ...obj, TenantId: tenantId })

const addTenantFilter = (params, tenantId) => {
  let { action, args } = params
  const fn = addTenantProperty(tenantId)

  R.cond([
    [
      R.equals('findUnique'),
      () => {
        set(params, 'action', 'findFirst')
        R.forEachObjIndexed((val, key) => {
          const isComposedUnique = key.match(/[[a-zA-Z]*_[a-zA-z]*/)
          if (isComposedUnique) {
            params.args.where = { ...params.args.where, ...val }
            delete params.args.where[key]
          }
        }, params.args.where)
        set(params, 'args.where', fn(args.where))
        return params.args
      }
    ],
    [R.equals('create'), () => set(params, 'args.data', fn(args.data))],
    [
      R.equals('createMany'),
      () =>
        set(
          params,
          'args.data',
          R.map(item => fn(item), args?.data ?? [])
        )
    ],
    [
      R.equals('upsert'),
      () =>
        set(params, 'args', {
          ...args,
          create: args?.create ? fn(args.create) : args?.create,
          where: args?.update ? fn(args.where) : args?.where
        })
    ],
    [R.T, () => set(params, 'args.where', fn(args?.where))]
  ])(action)
}

module.exports = {
  buildTableHasColumnPredicate,
  addTenantFilter
}

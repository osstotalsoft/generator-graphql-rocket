const { camelizeKeys } = require('humps')
const { PRISMA_DEBUG<% if(withMultiTenancy){ %>, IS_MULTITENANT<%if(!hasSharedDb){%>, PRISMA_DB_URL_PATTERN <%}%><%}%>} = process.env
const { PrismaClient } = require('@prisma/client')
<%_ if(withMultiTenancy){ _%>
const { getTenantContext } = require('../multiTenancy/tenantManager')
<%_ if(hasSharedDb){ _%>
  const { buildTableHasColumnPredicate, addTenantFilter } = require('./tenancyFilter')
<%_}else{_%>
const { sanitizeConnectionInfo } = require('../utils/functions')
<%_}_%>
const isMultiTenant = JSON.parse(IS_MULTITENANT)
<%_}_%>

const cacheMap = new Map()
const prismaOptions = { log: JSON.parse(PRISMA_DEBUG ?? false) ? ['query'] : ['error'] }

const applyMiddleware = prismaClient => {
  prismaClient.$on('warn', e => {
    console.log(e)
  })
  prismaClient.$on('error', e => {
    console.log(e)
  })

  prismaClient.$use(async (params, next) => {
    const result = await next(params)
    const resultData = camelizeKeys(result)
    return resultData
  })
}

function prisma() {
  let prismaClient
  <%_ if(withMultiTenancy){ _%>
  if (isMultiTenant) {
    const { id, connectionInfo } = getTenantContext()
    if (!id || !connectionInfo) throw new Error(`Could not identify tenant!`)

    if (cacheMap.has(id)) return cacheMap.get(id)

    <%_ if(hasSharedDb){ _%>
      prismaClient = new PrismaClient(prismaOptions)

      // tenancy where filter
      buildTableHasColumnPredicate('TenantId', prismaClient).then(tableHasColumnTenantId => {
        prismaClient.$use(async (params, next) => {
          const tableHasColumnTenant = tableHasColumnTenantId(params.model)
          if (tableHasColumnTenant) {
            const { id } = getTenantContext()

            addTenantFilter(params, id)

            const result = await next(params)
            return result
          }
          return next(params)
        })
      })

      applyMiddleware(prismaClient)
      cacheMap.set(id, prismaClient)
    <%_} else { _%>
      const { server, port, database, userName, password } = sanitizeConnectionInfo(connectionInfo)
      const url = PRISMA_DB_URL_PATTERN.replace('{server}', server)
        .replace('{port}', port)
        .replace('{database}', database)
        .replace('{user}', userName)
        .replace('{password}', password)

      prismaClient = new PrismaClient({ datasources: { db: { url } } }, prismaOptions)
      applyMiddleware(prismaClient)
      cacheMap.set(id, prismaClient)
    <%_}_%>
    } else {
      if (cacheMap.has('default')) return cacheMap.get('default')
      prismaClient = new PrismaClient(prismaOptions)
      applyMiddleware(prismaClient)
      cacheMap.set('default', prismaClient)
    }
  <%_} else { _%>
    if (cacheMap.has('default')) return cacheMap.get('default')
    prismaClient = new PrismaClient(prismaOptions)
    applyMiddleware(prismaClient)
    cacheMap.set('default', prismaClient)
  <%_}_%>

  return prismaClient
}

module.exports = { prisma }

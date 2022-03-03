const { camelizeKeys } = require('humps')
const { PRISMA_DEBUG<% if(withMultiTenancy){ %>, PRISMA_DB_URL_PATTERN <%}%>} = process.env
const { PrismaClient } = require('@prisma/client')
<%_ if(withMultiTenancy){ _%>
const { getTenantContext } = require('../multiTenancy/tenantManager')
const { sanitizeConnectionInfo } = require('../utils/functions')
const { buildTableHasColumnPredicate, addTenantFilter } = require('./tenancyFilter')
<%_}_%>

const cacheMap = new Map()
const prismaOptions = { log: JSON.parse(PRISMA_DEBUG) ? ['query'] : ['error'] }

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
    const { id, connectionInfo, isSharedDb } = getTenantContext()
    if (!id || !connectionInfo) throw new Error(`Could not identify tenant!`)

    if (cacheMap.has(id)) return cacheMap.get(id)

    if(isSharedDb){
      const prismaClient = new PrismaClient(prismaOptions)

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
    }else{
      const { server, port, database, user, password } = sanitizeConnectionInfo(connectionInfo)
      const url = PRISMA_DB_URL_PATTERN.replace('{server}', server)
        .replace('{port}', port)
        .replace('{database}', database)
        .replace('{user}', user)
        .replace('{password}', password)

      prismaClient = new PrismaClient({ datasources: { db: { url } } }, prismaOptions)
      applyMiddleware(prismaClient)
      cacheMap.set(id, prismaClient)
   }
  <%_} else { _%>
    prismaClient = new PrismaClient(prismaOptions)
    applyMiddleware(prismaClient)
  <%_}_%>

  return prismaClient
}

module.exports = { prisma }

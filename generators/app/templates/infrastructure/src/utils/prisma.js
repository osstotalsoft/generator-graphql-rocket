const { PrismaClient } = require('@prisma/client')
const { camelizeKeys } = require('humps')
const { PRISMA_DEBUG } = process.env

let prisma

const initPrismaClient = () => {
  const prismaClient = new PrismaClient({ log: JSON.parse(PRISMA_DEBUG) ? ['query'] : null })
  prismaClient.$on('query', e => {
    console.log('Query: ' + e.query + ' --- Duration: ' + e.duration + 'ms')
  })
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

  prisma = prismaClient
  return prismaClient
}

module.exports = prisma ?? initPrismaClient()

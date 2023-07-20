const { prisma, initialize } = require('./client')
const { prismaPaginated } = require('./utils')
module.exports = { prisma, initialize, prismaPaginated }

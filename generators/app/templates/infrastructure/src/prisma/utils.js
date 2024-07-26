const { defaultTo } = require('ramda')

function cursorPaginationOptions(pager, direction = defaultTo(1, pager?.direction)) {
  const { afterId, pageSize, sortBy = 'id' } = pager
  const options = afterId
    ? {
        skip: 1,
        cursor: {
          id: afterId
        }
      }
    : {}

  return {
    ...options,
    take: pageSize,
    orderBy: {
      [sortBy]: direction ? 'asc' : 'desc'
    }
  }
}

/**
 *
 * @param prismaModel Prisma queried model
 * @param pager Pager input object with the following structure:
 * `{
 *  afterId: String
 *  sortBy: String
 *  direction: Int
 *  pageSize: Int
 * }`
 * @param metadata Prisma Client `findMany` function arguments:
 * `{
 *  where: {},
 *  include: {},
 *  select: {},
 *  distinct: {}
 * }`
 * @returns `{ values: object[], pagination: Pagination }`
 */
async function prismaPaginated(prismaModel, pager = {}, metadata = {}) {
  const { pageSize, direction } = pager
  const options = { ...metadata, ...cursorPaginationOptions(pager) }
  const [values, totalCount, prevPageValues] = await Promise.all([
    await prismaModel.findMany(options),
    await prismaModel.count({ where: metadata.where }),
    await prismaModel.findMany({
      ...metadata,
      ...cursorPaginationOptions(pager, !direction),
      select: { id: true }
    })
  ])
  const prevAfterId = prevPageValues?.[pageSize - 1]?.id
  const nextAfterId = values[pageSize - 1]?.id
  const result = {
    values,
    pagination: {
      totalCount,
      prevPage: { ...pager, afterId: prevAfterId },
      nextPage: { ...pager, afterId: nextAfterId }
    }
  }
  return result
}

module.exports = { cursorPaginationOptions, prismaPaginated }

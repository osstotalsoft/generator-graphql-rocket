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
async function prismaPaginated(prismaModel, pager, metadata = {}) {
  const { pageSize, direction } = pager
  const [values, totalCount, prevPageValues] = await Promise.all([
    await prismaModel.findMany({
      ...metadata,
      ...cursorPaginationOptions(pager)
    }),
    await prismaModel.count(),
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

module.exports = { prismaPaginated }
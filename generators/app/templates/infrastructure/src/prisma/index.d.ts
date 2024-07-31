import { Prisma, PrismaClient } from '@prisma/client'

export function prisma(): PrismaClient

export type PrismaModel = PrismaClient[Uncapitalize<Prisma.ModelName>]

type Pager = {
  afterId: String
  sortBy: String
  direction: Int
  pageSize: Int
}

type Page = {
  afterId: String
  sortBy: String
  direction: Int
  pageSize: Int
}

type Pagination = {
  totalCount: Int
  prevPage: Page
  nextPage: Page
}

type PaginatedResult = {
  values: object[]
  pagination: Pagination
}

type PrismaMetadata<M = PrismaModel> = ArgumentTypes<PrismaClient[Uncapitalize<M>]['findMany']>

export function prismaPaginated(prismaModel: PrismaModel, pager: Pager, metadata: PrismaMetadata): Promise<PaginatedResult>

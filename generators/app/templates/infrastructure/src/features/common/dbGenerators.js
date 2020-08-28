const generateTopClause = (queryBuilder, pageSize) => {
    if (pageSize) {
        queryBuilder.limit(pageSize);
    }
}

const getSortByValue = async (dbInstance, afterId, sortBy, table, pk) => {
    if (afterId) {
        const data = await dbInstance.select(`${sortBy} AS SortBy`).from(table).where(pk, afterId).first();
        return data.sortBy;
    }
}

const generatePrevPageWhereClause = (queryBuilder, { afterId, direction = 1, sortBy, sortByValue, pk }) => {
    if (afterId) {
        if (sortBy === pk) {
            queryBuilder.andWhere(pk, direction ? "<" : ">", afterId);
        } else {
            queryBuilder.andWhere(function () {
                this.where(sortBy, direction ? "<" : ">", sortByValue)
                    .orWhere(function () {
                        this.where(sortBy, sortByValue)
                            .andWhere(pk, direction ? "<" : ">", afterId)
                    })
            });
        }
    }
}

const generateOrderByClause = (queryBuilder, { sortBy, direction = 0, pk }) => {
    if (sortBy === pk) {
        queryBuilder.orderBy(pk, direction ? "asc" : "desc");
    } else {
        queryBuilder.orderBy(`${sortBy}`, direction ? "asc" : "desc")
            .orderBy(pk, direction ? "asc" : "desc");
    }
}

const generateSortByPkClause = (queryBuilder, { sortBy, pk, direction, afterId, sortByValue }) => {
    if (sortBy === pk) {
        queryBuilder.andWhere(pk, direction ? ">=" : "<=", afterId);
    } else {
        queryBuilder.andWhere(function () {
            this.where(sortBy, direction ? ">" : "<", sortByValue)
                .orWhere(function () {
                    this.where(sortBy, sortByValue)
                        .andWhere(pk, direction ? ">=" : "<=", afterId)
                })
        });
    }
}

const asBase64 = (knex, column, alias = undefined) => {
    const asColumn = alias || column
    return knex.raw(`CAST(N'' AS XML).value('xs:base64Binary(xs:hexBinary(sql:column("${column}")))', 'VARCHAR(MAX)') as [${asColumn}]`)
}

const hasValue = (knex, column, alias = undefined) => {
    const asColumn = alias || column
    return knex.raw(`(CASE WHEN [${column}] IS NULL THEN 0 ELSE 1 END) as [${asColumn}]`)
}

module.exports = { generateTopClause, getSortByValue, generatePrevPageWhereClause, generateOrderByClause, generateSortByPkClause, asBase64, hasValue }
const DataLoader = require("dataloader");

const getTenantDataLoaders = dbInstance => {
    return {
        tenantByExternalId: new DataLoader(externalIds =>
            dbInstance
                .select(
                    "Id",
                    "Name",
                    "Code",
                    "ExternalId"
                )
                .from("Tenant")
                .whereIn("ExternalId", externalIds)
                .then(rows => externalIds.map(externalId => rows.find(row => row.externalId.toUpperCase() === externalId.toUpperCase())))
        )
    }
}

module.exports = { getTenantDataLoaders };
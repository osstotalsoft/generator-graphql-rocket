const { SQLDataSource } = require("datasource-sql")

class TenantDataSource extends SQLDataSource {

    async getTenants() {
        const tenants = await this.knex.select("Id", "Name", "Code", "ExternalId").from("Tenant");
        return tenants;
    }

    async getTenantFromHost(hostname) {
        const tenant = await this.knex.select("Id", "Name", "Code", "ExternalId").from("Tenant").where("Host", hostname).first();
        return tenant;
    }

    async getTenantFromId(id) {
        const tenant = await this.knex.select("Id", "Name", "Code", "ExternalId").from("Tenant").where("ExternalId", id).first();
        return tenant;
    }

    async getDataSourceInfo(tenantId) {
        const tenant = await this.knex.select("ConnectionString", "IsSharedDb").from("Tenant").where("ExternalId", tenantId).first();
        return tenant;
    }
}

module.exports = TenantDataSource;
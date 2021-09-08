const { NoCacheRESTDataSource } = require('../../../utils/noCacheRESTDataSource');

class TenantIdentityApi extends NoCacheRESTDataSource {
    constructor() {
        super();
        this.baseURL = `${process.env.IDENTITY_API_URL}`;
    }

    cacheKeyFor(request) {
        return `${request.url}${this.context.externalUser.id}`
    }

    willSendRequest(request) {
        request.headers.set('Authorization', this.context.token);
        request.headers.set('TenantId', this.context.tenant.externalId);
    }

    async getTenants() {
        return await this.get(`HomeRealmDiscovery/tenants`);
    }
}

module.exports = TenantIdentityApi;
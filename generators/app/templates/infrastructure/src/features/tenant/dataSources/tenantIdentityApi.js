const { NoCacheRESTDataSource } = require('../../../utils/noCacheRESTDataSource');
const { assoc } = require('ramda')

class TenantIdentityApi extends NoCacheRESTDataSource {
    constructor(context) {
        super(context);
        this.baseURL = `${process.env.IDENTITY_API_URL}`;
        this.context = context
    }

    cacheKeyFor(request) {
        return `${request.url}${this.context.externalUser.id}`
    }

    willSendRequest(_path, request) {
        request.headers = assoc('Authorization', this.context.token, request.headers)
        request.headers = assoc('TenantId', this.context.tenant?.id, request.headers)
    }

    async getTenants() {
        return await this.get(`HomeRealmDiscovery/tenants`);
    }
}

module.exports = TenantIdentityApi;

const { RESTDataSource } = require('apollo-datasource-rest');

class UserApi extends RESTDataSource {

    constructor() {
        super();
        this.baseURL = `${process.env.API_URL}user`;
    }

    willSendRequest(request) {
        request.headers.set('Authorization', this.context.token);
        <%_ if(withMultiTenancy){ _%>
        request.headers.set('TenantId', this.context.tenantId);
        <%_}_%>
    }

    async getRights() {
        const data = await this.get(`rights`);
        return data;
    }

    async getUserData() {
        const data = await this.get(`userData`);
        return data;
    }
}

module.exports = UserApi;
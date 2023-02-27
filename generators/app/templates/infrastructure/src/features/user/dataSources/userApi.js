const { NoCacheRESTDataSource } = require('../../../utils/noCacheRESTDataSource');
const { assoc } = require('ramda')

class UserApi extends NoCacheRESTDataSource {

    constructor(context) {
        super(context);
        this.baseURL = `${process.env.API_URL}user`;
        this.context = context
    }

    willSendRequest(_path, request) {
        request.headers = assoc('Authorization', this.context.token, request.headers)
        <%_ if(withMultiTenancy){ _%>
        request.headers = assoc('TenantId', this.context.tenantId, request.headers)
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
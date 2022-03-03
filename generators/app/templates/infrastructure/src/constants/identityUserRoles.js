module.exports = {
    admin: "tenant_admin",
    user: "tenant_user"<% if(withMultiTenancy){ %>,
    globalAdmin: "global_admin"
    <%}%>
}
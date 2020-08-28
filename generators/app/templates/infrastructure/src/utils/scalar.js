const { GraphQLScalarType } = require('graphql');

const DateTimeType = new GraphQLScalarType({
    name: 'DateTime',
    description: 'js date time',
    serialize(value) {
        return new Date(value);
    },
    parseValue(value) {
        return new Date(value);
    },
    parseLiteral(value) {
        return new Date(value);
    }
});

module.exports = DateTimeType;
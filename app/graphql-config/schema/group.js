const groupsKey = 'groups';
const viewName = "vw_graphql_group_info";

const builder = require('./builder');
const resolvers = builder.buildBasicResolvers(groupsKey, viewName);

module.exports = {
    resolvers:{
        groups: resolvers.getCollection
    },
    type: `
    type Group {
        id: ID!,
        name: String,
        type: String
    }
    extend type Query {
        groups: [Group]!
    }`
};

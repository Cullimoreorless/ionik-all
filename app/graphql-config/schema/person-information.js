const personInfoKey = 'personInformation';
const viewName = 'vw_graphql_person_information';

const builder = require('./builder');

const resolvers = builder.buildBasicResolvers(personInfoKey, viewName);

module.exports = {
    resolvers:{
        person: resolvers.getById,
        persons: resolvers.getCollection
    },
    type: `
    type Person {
        id: ID!,
        personCode:String,
        firstName:String,
        lastName:String,
        gender: String,
        email: String.
        birthDay:String, 
        locationName:String,
        groups: [Group]
    }
    extend type Query {
        person(id:Int!): Person,
        persons:[Person]!
    }`
};

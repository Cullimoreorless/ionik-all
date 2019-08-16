let group = require('./group');
let personInfo = require('./person-information');
let message = require('./message');


module.exports = {
    resolvers:{
        ...group.resolvers,
        ...personInfo.resolvers,
        ...message.resolvers
    },
    types:[
        group.type,
        personInfo.type,
        message.type
    ],
    typeResolvers:{
        ...message.typeResolver
    }
};

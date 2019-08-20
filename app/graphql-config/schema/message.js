const cacheKey = 'messages';
const viewName = 'vw_graphql_message_info';

const getPersonById = require('./person-information').resolvers.person;


const builder = require('./builder');

const basicResolvers = builder.buildBasicResolvers(cacheKey, viewName);


module.exports = {
    resolvers:{
        message:basicResolvers.getById,
        messages: basicResolvers.getCollection
    },
    type:`
    type Message{
        sender: Person,
        recipient: Person,
        messageId: Int,
        totalNumberOfRecipients: Int,
        weightedMessage: Float, 
        senderLocalTime: String,
        recipientLocalTime: String,
        sentOutOfWorkHours: Boolean 
    }
    extend type Query {
        message:Message
        messages:[Message]!
    }`,
    typeResolver:{
        Message : {
            sender: async ({senderId}, args, ctx) => {
                return await getPersonById({senderId}, {id:senderId}, ctx);
            },
            recipient: async ({recipientId}, args, ctx) => {
                return await getPersonById({recipientId}, {id:recipientId}, ctx);
            },
            messageId: async({messageId}) => messageId,
            totalNumberOfRecipients: async({totalNumberOfRecipients }) => totalNumberOfRecipients,
            weightedMessage:({weightedMessage }) => weightedMessage,
            senderLocalTime: ({senderLocalTime }) => senderLocalTime,
            recipientLocalTime: ({recipientLocalTime }) => recipientLocalTime,
            sentOutOfWorkHours: ({sentOutOfWorkHours }) => sentOutOfWorkHours
        }
    }
}

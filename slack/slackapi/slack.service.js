const db = require('./slack.db');
const uuid = require('uuid');

const client_id = process.env.SLACKCLIENTID;
const client_secret = process.env.SLACKCLIENTSECRET;

const {WebClient} = require("@slack/client")
let sc = new WebClient("");

const apis = {
  "oauth.access": sc.oauth.access,
  "users.list":sc.users.list,
  "conversations.list":sc.conversations.list,
  "conversations.history":sc.conversations.history,
  "team.info":sc.team.info,
  "conversations.members":sc.conversations.members
};

const makeApiCall = async (apiName, config) => {
  let result = null;
  try{
    result = await apis[apiName](config);
    if(!result.ok){
      throw new Error(result.error);
    }
    if(apiName === 'oauth.access'){
      sc.token = result.access_token
    }
  }
  catch(err){
    let errMessage = `Could not make Slack call '${apiName}': ${err}`;
    console.error(errMessage);
    throw new Error(errMessage);
  }
  return result;
};

async function makePaginatedApiCall(apiName, config, limit, result)
{
  if(!result){
    result = [];
  }
  try {
    if(!config){
      config = {};
    }
    if(!limit){
      limit = 200;
    }
    config.limit = limit;
    let singularResult = await makeApiCall(apiName, config);
    if(singularResult && !Array.isArray(singularResult))
    {
      singularResult = [singularResult];
    }
    result = [...result, ...singularResult];
    if(singularResult[0] && singularResult[0].response_metadata && singularResult[0].response_metadata.next_cursor)
    {

      config.cursor = singularResult[0].response_metadata.next_cursor;
      result = makePaginatedApiCall(apiName, config, limit, result);
    }
  }
  catch (e) {
    console.error(`makePaginatedApiCall - error: ${e.message}`);
  }
  return result;
}

const getCompanyData = async (transactionUUID) => {
  let teamId='';
  const companyRes = await makeApiCall("team.info",{});
  console.log(JSON.stringify(companyRes));
  if(companyRes && companyRes.team && companyRes.team.id)
  {
    teamId = companyRes.team.id
  }
  db.executeQuery(db.queries.saveWorkspace,[
    companyRes.team.id,
    companyRes.team.name,
    companyRes.team.domain,
    transactionUUID
  ]);
  return teamId;
};

const getUserData = async (transactionUUID) => {
  let userRes = await makeApiCall("users.list",{limit:100});
  let qRes = await db.executeQuery(db.queries.saveUsers, [
    JSON.stringify(userRes),
    transactionUUID]);
  return userRes
};

const getChannelData = async (transactionUUID) => {
  let conversations;
  try{
    conversations = await makeApiCall("conversations.list",{});
    for(channel of conversations.channels){
      let insRes = await db.executeQuery(db.queries.saveChannelDetails,
          [channel.id, channel.num_members, transactionUUID])
      let channelMembers = await makeApiCall("conversations.members",{
        channel:channel.id
      });
      db.executeQuery(db.queries.saveChannelMembers,
          [channel.id, JSON.stringify(channelMembers.members), transactionUUID]);
      hasMoreMessages = true;

      let conversationHistory = await makePaginatedApiCall("conversations.history",{
        channel: channel.id
      }, 20, []);
      db.executeQuery(db.queries.saveMessages, [channel.id, JSON.stringify(conversationHistory), transactionUUID]);
    }
  }
  catch(err){
    let errMessage = "Could not retrieve conversation history: " + err;
    console.error(errMessage)
  }
  return conversations;
};

async function runIntegration()
{
  let transactionUUID = uuid();
  await getUserData(transactionUUID);
  await getChannelData(transactionUUID);
  await getCompanyData(transactionUUID);
}

const slackClient = {
  apis:apis,
  makeApiCall: makeApiCall,
  makePaginatedApiCall: makePaginatedApiCall,
  runIntegration: runIntegration
};

module.exports = slackClient;

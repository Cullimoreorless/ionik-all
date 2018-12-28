
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
    if(apiName == 'oauth.access'){
      sc.token = result.access_token
    }
  }
  catch(err){
    let errMessage = `Could not make Slack call '${functionName}': ${err}`;
    console.error(errMessage);
    throw new Error(errMessage);
  }
  return result;
}

const slackClient = {
  apis:apis,
  makeApiCall: makeApiCall
};

module.exports = slackClient;
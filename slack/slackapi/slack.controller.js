const express = require("express");
const router = express.Router();
const uuid = require('uuid')

const db = require('./slack.db')
require('dotenv').config();
const sc = require('./slack.service');


const client_id = process.env.SLACKCLIENTID;
const client_secret = process.env.SLACKCLIENTSECRET;

// const {WebClient} = require("@slack/client")
// let sc = new WebClient("");


router.get('/authorize',(req, res) => {
  scope = "channels:history channels:read groups:history team:read users:read";
  res.send(`<a href="https://slack.com/oauth/authorize?scope=${scope}&client_id=${client_id}">
  Add to Slack
</a>`)
});

router.get('/finishAuth', async (req, res) => {
  let authCode = req.query.code;
  let message = "";
  let authRes = await sc.makeApiCall("oauth.access", {
    "client_id":client_id,
    "client_secret":client_secret,
    "code":authCode});
  process.env.SLACKUSERTOKEN = authRes.access_token;
  // sc.token = authRes.access_token;
  message = "Finished Slack authentication successfully";
  let transactionUUID = uuid();
  await getUserData(transactionUUID);
  await getChannelData(transactionUUID);
  await getCompanyData(transactionUUID);
  res.send(message);
  
});

router.get('/getUsers', async (req, res) => {
  let userRes = await getUserData();
  res.send(userRes);
});

router.get('/getTeam', async (req, res) => {
  let companyRes = await getCompanyData();
  res.send(companyRes)
});

router.get('/getChannelHistory', async (req, res) => {
  let conv = await getChannelData();
  res.send(conv);
});

const getCompanyData = async (transactionUUID) => {
  let companyRes = await sc.makeApiCall("team.info",{});
  db.executeQuery(db.queries.saveWorkspace,[
    companyRes.team.id,
    companyRes.team.name,
    companyRes.team.domain,
    transactionUUID
  ]);
  return companyRes;
}

const getUserData = async (transactionUUID) => {
  let userRes = await sc.makeApiCall("users.list",{});
  qRes = await db.executeQuery(db.queries.saveUsers, [
    JSON.stringify(userRes), 
    transactionUUID]);
  return userRes
}

const getChannelData = async (transactionUUID) => {
  let conversations;
  try{
    conversations = await sc.makeApiCall("conversations.list",{});
    for(channel of conversations.channels){
      let insRes = await db.executeQuery(db.queries.saveChannelDetails, 
        [channel.id, channel.num_members, transactionUUID])
      let channelMembers = await sc.makeApiCall("conversations.members",{
        channel:channel.id
      });
      db.executeQuery(db.queries.saveChannelMembers, 
        [channel.id, JSON.stringify(channelMembers.members), transactionUUID]);
      hasMoreMessages = true;
      // while(hasMoreMessages){
      let conversationHistory = await sc.makeApiCall("conversations.history",{
        channel: channel.id
      });
      db.executeQuery(db.queries.saveMessages, [channel.id, JSON.stringify(conversationHistory.messages), transactionUUID])
      //   hasMoreMessages = conversationHistory.response_metadata.has_more
      // }
    }
  }
  catch(err){
    let errMessage = "Could not retrieve conversation history: " + err;
    console.error(errMessage)
  }
  return conversations;
}

module.exports=router
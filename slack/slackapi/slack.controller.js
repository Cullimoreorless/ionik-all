const express = require("express");
const router = express.Router();

const db = require('./slack.db')
require('dotenv').config();


const client_id = process.env.SLACKCLIENTID;
const client_secret = process.env.SLACKCLIENTSECRET;

const {WebClient} = require("@slack/client")
let sc = new WebClient("");


router.get('/authorize',(req, res) => {
  scope = "channels:history channels:read groups:history team:read users:read";
  res.send(`<a href="https://slack.com/oauth/authorize?scope=${scope}&client_id=${client_id}">
  Add to Slack
</a>`)
});

router.get('/finishAuth', (req, res) => {
  let authCode = req.query.code;
  let message = ""
  sc.oauth.access({
    "client_id":client_id,
    "client_secret":client_secret,
    "code":authCode})
    .then((authRes) =>{
      process.env.SLACKUSERTOKEN = authRes.access_token;
      sc.token = authRes.access_token;
      message = "Finished Slack authentication successfully";
      res.send(message);
    }).catch((err) => {
      message = "Could not authenticate to Slack: " + err;
      console.error(message);
      res.send(message);
    });
});

router.get('/getUsers', (req, res) => {
  sc.users.list({}).then( async (userRes) =>{
    // try{
    qRes = await db.executeQuery(db.queries.saveUsers, [JSON.stringify(userRes)])
    // }
    // catch(err){
    //   let errMessage = 'Could not save users to db: ' + err;
    //   console.error(errMessage);
    // }
    console.log(qRes)
    res.send(userRes);
  }).catch((err) =>{
    let errMessage = "Could not retrieve users: " + err;
    console.error(errMessage)
    res.send(errMessage)
  })
})

router.get('/getChannelHistory', async (req, res) => {
  let conv = await getChannelData();
  res.send(conv);
})

const getChannelData = async () => {
  let conversations = await sc.conversations.list();
  console.log(JSON.stringify(conversations))
  return conversations;
}

module.exports=router
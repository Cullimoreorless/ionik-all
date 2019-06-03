const express = require("express");
const router = express.Router();

require('dotenv').config();
const sc = require('./slack.service');


const client_id = process.env.SLACKCLIENTID;
const client_secret = process.env.SLACKCLIENTSECRET;


router.get('/authorize',(req, res) => {
  scope = "channels:history channels:read groups:history team:read users:read";
  res.send(`<a href="https://slack.com/oauth/authorize?scope=${scope}&client_id=${client_id}">
  Add to Slack
</a>`)
});

router.get('/finishAuth', async (req, res) => {
  let authCode = req.query.code;
  let message = null;
  let authRes = await sc.makeApiCall("oauth.access", {
    "client_id":client_id,
    "client_secret":client_secret,
    "code":authCode});

  process.env.SLACKUSERTOKEN = authRes.access_token;
  sc.runIntegration();
  message = "Finished Slack authentication successfully";
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



module.exports=router;

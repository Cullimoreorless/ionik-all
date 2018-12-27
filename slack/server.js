const express = require("express")
const helmet = require('helmet')
const slackController = require('./slackapi/slack.controller');
require('dotenv').load();

const app = express();
app.use(helmet())
const port = process.env.PORT ||3000;

app.use("/", slackController)

app.listen(port, () => {
  console.log(`Ionik Slack App listening on port ${port}`)
});


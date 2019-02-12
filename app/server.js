const express = require("express")
const helmet = require('helmet')
const graphController = require('./graph/graph.controller')
// const userController = require('./user/user.controller')

const path = require('path')


require('dotenv').load();

const app = express();

app.set('view engine','ejs')
app.set('views',path.join(__dirname, "/views"))
app.use(helmet())
const port = process.env.PORT ||3000;

app.use(express.static(path.join(__dirname, "public")))

app.use("/molecule", graphController)
// app.user("/user",userController)


app.listen(port, () => {
  console.log(`Ionik Web App listening on port ${port}`)
});


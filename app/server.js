const express = require("express")
const helmet = require('helmet')
const graphController = require('./graph/graph.controller')
// const userController = require('./user/user.controller')

//crud controllers
const companyController = require('./controllers/company.controller')

const path = require('path')

require('dotenv').load();
const dbConn = {
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
}; 


const app = express();

app.set('view engine','ejs')
app.set('views',path.join(__dirname, "/views"))

//setup session store usage
const pgConn = require('pg');
const session = require('express-session');
const pgSess = require('connect-pg-simple')(session);

let pgSessPool = pgConn.Pool(dbConn);

app.use(session({
  store:new pgSess({
    pool:pgSessPool
  }),
  secret:process.env.SIAMOCOOKIESECRET,
  resave:false,
  cookie:{
    maxAge: 1000 * 60 * 60
  }
}))


app.use(helmet())
app.use(express.json())
const port = process.env.PORT ||3000;

app.use(express.static(path.join(__dirname, "public")))

app.use("/molecule", graphController); 
// app.user("/user",userController)
app.use('/company', companyController);

app.listen(port, () => {
  console.log(`Siamo Web App listening on port ${port}`)
});


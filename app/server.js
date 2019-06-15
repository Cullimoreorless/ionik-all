require('dotenv').load();
const express = require("express");
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const graphController = require('./graph/graph.controller');
// const userController = require('./user/user.controller')
const authController = require('./controllers/auth.controller');
const adminController = require('./controllers/admin.controller');

//crud controllers
const companyController = require('./controllers/company.controller');
const systemController = require('./controllers/system.controller');


const path = require('path')

const dbConn = {
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
}; 


const app = express();

app.set('view engine','ejs');
app.set('views',path.join(__dirname, "/views"));



const identifierMiddleware = async (req, res, next) => {
  if(req.headers.authorization){
    let bearerToken = req.headers.authorization.replace('Bearer ','');
    try{
      let decoded = jwt.verify(bearerToken, process.env.SIAMOCOOKIESECRET);
      req.companyId = decoded.cid;
      req.userId = decoded.uid;
      req.roles = decoded.roles;
    }
    catch(err){
      console.error(`Could not decode JWT - ${err.message}`)
    }
  }
  next();
};

const mustHaveRoleMiddleware = async (req, res, next, roleName) =>
{
  if(!(req && req.roles && Array.isArray(req.roles) && req.roles.includes(roleName)))
  {
    console.log('roleMiddleware - user does not have role to access this request')
    res.sendStatus(403);
  }
  else {
    next();
  }
};

const mustHaveCompany = async (req, res, next) => {
  if(!req.companyId){
    console.log("CompanyMiddleware - no company could be found on this request")
    res.sendStatus(403);
  }
  else{
    next();
  }
};

app.use(identifierMiddleware);

app.use(helmet())
app.use(express.json())
const port = process.env.PORT ||3000;

app.use(express.static(path.join(__dirname, "public")))

app.use("/molecule", graphController); 
// app.user("/user",userController)
app.use('/company', companyController);
app.use('/system', systemController);
app.use('/auth', authController); 
app.use('/admin', adminController);

app.listen(port, () => {
  console.log(`Siamo Web App listening on port ${port}`)
});


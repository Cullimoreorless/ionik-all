require('dotenv').load();
const express = require("express");
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');


const middleware = require('./middleware/auth.middleware');

const graphController = require('./graph/graph.controller');
// const userController = require('./user/user.controller')
const authController = require('./controllers/auth.controller');
const adminController = require('./controllers/admin.controller');

//crud controllers
const companyController = require('./controllers/company.controller');
const systemController = require('./controllers/system.controller');
const companyAdminController = require('./controllers/company-admin.controller');
const metricController = require('./controllers/metric.controller');


const path = require('path')

const dbConn = {
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
};
const db = require('./db/db.service');


const app = express();

app.set('view engine','ejs');
app.set('views',path.join(__dirname, "/views"));



// const identifierMiddleware = async (req, res, next) => {
//   if(req.headers.authorization){
//     let bearerToken = req.headers.authorization.replace('Bearer ','');
//     try{
//       let decoded = jwt.verify(bearerToken, process.env.SIAMOCOOKIESECRET);
//       req.companyId = decoded.cid;
//       req.userId = decoded.uid;
//       req.roles = decoded.roles;
//     }
//     catch(err){
//       console.error(`Could not decode JWT - ${err.message}`)
//       // res.status(403).send({'message':'Unauthorized'})
//     }
//   }
//   next();
// };

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

// app.use(identifierMiddleware);

app.use(helmet());
app.use(express.json());
app.use(fileUpload({
  limits:{ fileSize: 50 * 1024 * 1024 },
  useTempFiles:true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));
const port = process.env.PORT ||3000;

app.use(express.static(path.join(__dirname, "public")))

app.use("/molecule", graphController);
// app.user("/user",userController)
app.use('/company', middleware.identifierMiddleware, middleware.checkForRole('SystemAdmin'), companyController);
app.use('/system', middleware.identifierMiddleware, systemController);
app.use('/auth', authController); 
app.use('/admin', middleware.identifierMiddleware, middleware.checkForRole('SystemAdmin'), adminController);
app.use('/companyAdmin', middleware.identifierMiddleware, middleware.checkForRole('CompanyAdmin'), companyAdminController);
app.use('/metrics',middleware.identifierMiddleware, middleware.mustHaveCompany, metricController);


const {ApolloServer, gql} = require('apollo-server-express');
const typeDefs = gql`
  type Query {
    name: String
  }`;

const schema = require('./graphql-config/schema');

const root = {
  name:() => 'Siamo is awesome!!',
  ...schema.resolvers
};

const resolvers = {
  Query: root,
  ...schema.typeResolvers
};
const context = async({req, res}) => {
  console.log('context req',req.companyId);
  // if(!req.companyId)
  // {
  //   res.status(403).send({message:"Not Authorized"})
  // }
  req.companyId = 2;
  return {
    db:{
      query: db.executeQuery
    },
    cid:req.companyId
  };
};

const server = new ApolloServer({ typeDefs:[typeDefs, ...schema.types], resolvers, context});

server.applyMiddleware({app});

app.listen(port, () => {
  console.log(`Siamo Web App listening on port ${port}`)
});


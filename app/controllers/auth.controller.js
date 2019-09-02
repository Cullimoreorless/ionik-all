const express = require('express');
const router = express.Router();
const authService = require('./../db/auth.service')
const jwt = require('jsonwebtoken');

const CRUDContext = require('./../db/crud.service');
const userCtx = new CRUDContext('user')


router.post('/authenticate', async (req, res) =>{
  let credentials = req.body;
  try{
    let user = await authService.verifyUser(credentials.username, credentials.password);
    let expireDate = Math.floor(Date.now()/1000) + (2 * 60 * 60) //expires in 2 hours
    console.log('user',user);
    let token = authService.generateJWT(user.companyid, user.userid, user.roles, expireDate);
    console.log('token');
    res.send({success:true,
      expiresAt: expireDate,
      tkn:token});
  }
  catch(err){
    console.log('error')
    res.send({success:false, tkn:null, message:err.message});
  }
});

router.post('/registerUser', async (req, res) => {
  let newCredentials = req.body;
  if(newCredentials.password !== newCredentials.confirmPassword){
    res.status(500).send({success:false, message: "Passwords must match"});
  }
  //TODO: check username for uniqueness
  let passwordHash = authService.generatePasswordHash(newCredentials.password);

  let newUser = await userCtx.upsert({companyid: newCredentials.companyid ? newCredentials.companyid : null,
    pwhash:passwordHash,
    username:newCredentials.username});

  const successfulUserAdd = (newUser && newUser.userid);
  if(successfulUserAdd)
  {
    ////todo: roles add
    if(newCredentials.companyid)
    {
      authService.addRole(newUser.userid, 'CompanyAdmin');
    }
    else
    {
      authService.addRole(newUser.userid, 'SystemAdmin');
    }
  }

  res.send({
    success: successfulUserAdd,
    message: successfulUserAdd ? "Registered user" : "Could not register user"
  });
})

module.exports = router;

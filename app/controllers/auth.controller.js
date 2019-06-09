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
    let token = authService.generateJWT(user.companyid, user.userid, user.roles, expireDate);
    res.send({success:true,
      expiresAt: expireDate,
      tkn:token});
  }
  catch(err){
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

  let newUser = await userCtx.upsert({companyid: newCredentials.companyId, 
    pwhash:passwordHash,
    username:newCredentials.username});

  res.send({
    success: newUser && newUser.userid,
    message: (newUser && newUser.userid) ? "Registered user" : "Could not register user"
  });
})

module.exports = router;

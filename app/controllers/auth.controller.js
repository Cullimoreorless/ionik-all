const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');

router.post('/authenticate', async (req, res) =>{
  let credentials = req.body;
  if(credentials.username === 'test' && credentials.password === 'test'){
    console.log(Date.now());
    let expireDate = Math.floor(Date.now()/1000) + (120 * 60)
    let token = jwt.sign({
      cid: 7,
      uid: 1,
      expiresAt: expireDate
    }, process.env.SIAMOCOOKIESECRET,
    { expiresIn:"2h", subject: "1" })
    res.send({success:true,
      expiresAt: expireDate,
      tkn:token});
  }
  else{
    res.send({success:false, tkn:null});
  }
});

module.exports = router;
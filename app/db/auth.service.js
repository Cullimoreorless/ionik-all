
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CRUDContext = require('./crud.service');
const userCtx = new CRUDContext('user')

const generateJWT = (companyId, userId, expireDate) => {
  let token = jwt.sign({
    cid: companyId,
    uid: userId,
    expiresAt: expireDate
  }, process.env.SIAMOCOOKIESECRET,
  { expiresIn:"2h", subject: userId.toString() })
  return token;
}

const generatePasswordHash = (password) =>{
  return bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
}

const verifyUser = async (username, password) =>{
  //let hash = generatePasswordHash(password);
  let userFromDB = await userCtx.findAllByCondition({"username":username});
  if(!userFromDB || !userFromDB.length)
    throw new Error(`Could not find user '${username}'`);
  userFromDB = userFromDB[0];
  if(!bcrypt.compareSync(password, userFromDB.pwhash))
    throw new Error(`Incorrect password`)
  else{
    return {
      userid: userFromDB.userid,
      companyid: userFromDB.companyid,
      username: userFromDB.username
    }
  }
  
}


module.exports = {
  generateJWT: generateJWT,
  generatePasswordHash: generatePasswordHash,
  verifyUser: verifyUser
}
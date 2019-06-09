
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CRUDContext = require('./crud.service');
const userCtx = new CRUDContext('user');
const db = require('./db.service');

const getUserRoleQuery = `select au.userid, jsonb_agg(approlename) as roles
from app_user au 
 join app_user_role aur 
   on au.userid = aur.userid
 join app_role ar 
   on ar.approleid = aur.approleid
 where au.userid = :userId
 group by au.userid`;

const generateJWT = (companyId, userId, userRoles, expireDate) => {
  let token = jwt.sign({
    cid: companyId,
    uid: userId,
    roles: userRoles,
    expiresAt: expireDate
  }, process.env.SIAMOCOOKIESECRET,
  { expiresIn:"2h", subject: userId.toString() });
  return token;
};

const generatePasswordHash = (password) =>{
  return bcrypt.hashSync(password, parseInt(process.env.SALTROUNDS));
};

const verifyUser = async (username, password) =>{
  let userFromDB = await userCtx.findAllByCondition({"username":username});
  if(!userFromDB || !userFromDB.length)
    throw new Error(`Could not find user '${username}'`);
  userFromDB = userFromDB[0];
  if(userFromDB.userid)
  {
    userFromDB.roles = getUserRoles(userFromDB.userid);
  }
  if(!bcrypt.compareSync(password, userFromDB.pwhash))
    throw new Error(`Incorrect password`);
  else{
    return {
      userid: userFromDB.userid,
      companyid: userFromDB.companyid,
      username: userFromDB.username,
      roles: userFromDB.roles
    }
  }
  
};

const getUserRoles = async (userId) =>
{
  let roleRes = await db.executeQuery(getUserRoleQuery, {userId: userId})
  if(roleRes && roleRes[0] && roleRes[0].roles)
  {
    return roleRes[0].roles;
  }
  return [];
};


module.exports = {
  generateJWT: generateJWT,
  generatePasswordHash: generatePasswordHash,
  verifyUser: verifyUser
};

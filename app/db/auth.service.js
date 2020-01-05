
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CRUDContext = require('./crud.service');
const userCtx = new CRUDContext('user');
const db = require('./db.service');
const fs = require('fs');

const getUserRoleQuery = `select au.userid, jsonb_agg(approlename) as roles
from app_user au 
 join app_user_role aur 
   on au.userid = aur.userid
 join app_role ar 
   on ar.approleid = aur.approleid
 where au.userid = :userId
 group by au.userid`;

const addRoleQuery = `insert into app_user_role (userid, approleid)
  VALUES (:userId, (select approleid from app_role where approlename = :roleName limit 1))`;

// console.log('privateKe',privateKey);


const generateJWT = (companyId, userId, userRoles, expireDate) => {
  const privateKey = fs.readFileSync(__dirname + '/../rsakeys/private-siamo.pem');
  let token = jwt.sign({
    cid: companyId,
    uid: userId,
    roles: userRoles,
    expiresAt: expireDate
  }, {key: privateKey, passphrase:process.env.SIAMOCOOKIESECRET},
  { expiresIn:"2h", subject: userId.toString(), algorithm:'RS256' });
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
    userFromDB.roles = await getUserRoles(userFromDB.userid);
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

const addRole = async (userId, roleName) => {
  let insertRole = await db.executeQuery(addRoleQuery, {userId, roleName});
  // console.log(insertRole);
  return insertRole;
};

const getUserRoles = async (userId) =>
{
  let roleRes = await db.executeQuery(getUserRoleQuery, {userId: userId});
  if(roleRes && roleRes[0] && roleRes[0].roles)
  {
    return roleRes[0].roles;
  }
  return [];
};

const sysAdminExists = async() => {
  let result = await db.executeQuery(`select count(*) as sysadmincount from app_user_role where approleid = (select approleid from app_role where approlename = 'SystemAdmin' limit 1) `,{});
  return result && result[0] && result[0]["sysadmincount"]
};


module.exports = {
  generateJWT: generateJWT,
  generatePasswordHash: generatePasswordHash,
  verifyUser: verifyUser,
  addRole: addRole,
  sysAdminExists : sysAdminExists
};

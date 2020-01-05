
const jwt = require('jsonwebtoken');
const fs = require('fs');

const publicKey = fs.readFileSync(__dirname + '/../rsakeys/public-siamo.pem');

const identifierMiddleware = async (req, res, next) => {
    if(req.headers.authorization){
        let bearerToken = req.headers.authorization.replace('Bearer ','');
        try{
            let decoded = jwt.verify(bearerToken, publicKey, {algorithms:['RS256']});
            req.companyId = decoded.cid;
            req.userId = decoded.uid;
            req.roles = decoded.roles;
            if(decoded.cid || decoded.roles.includes("SystemAdmin")) {
                next();
            }
        }
        catch(err){
            res.status(403).send({"message":"Unauthorized"})
        }
    }
};

const checkForRole = (roleName) =>
{
    return async (req, res, next) =>
    {
        console.log(req.roles);
        if(!(req && req.roles && Array.isArray(req.roles) && req.roles.includes(roleName)))
        {
            console.log('roleMiddleware - user does not have role to access this request');
            res.sendStatus(403);
        }
        else {
            next();
        }
    };
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

module.exports = {mustHaveCompany, checkForRole, identifierMiddleware};

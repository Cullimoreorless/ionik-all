let CRUDContext = require('./../crud.service');
let DBHelper = require('./../db.service')


let CompanyIntegrationContext = new CRUDContext('companyIntegration');

let getCompanyIntegrationsList = async (companyId) =>{
  try{
    let query = `select * from vw_company_integrations_list where companyid = :companyId;`;
    let list = await DBHelper.executeQuery(query, { "companyId": companyId});
    return list;
  }
  catch(err){
    console.error("Could not retrieve company integrations list. Error - " + err.message);
  }
};
CompanyIntegrationContext.getCompanyIntegrationsList = getCompanyIntegrationsList;

module.exports = CompanyIntegrationContext;

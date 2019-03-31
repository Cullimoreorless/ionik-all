let CRUDContext = require('./../crud.service');
let DBHelper = require('./../db.service')


let CompanyIntegrationContext = new CRUDContext('companyIntegration');

let getCompanyIntegrationsList = async (companyId) =>{
  try{
    let query = `select companyintegrationid, integrationidentifier, systemtypedesc from company_integration cit 
    join system_type st 
      on st.systemtypeid = cit.systemtypeid
  where systemid is not null and cit.companyid = :companyId;`
    let list = await DBHelper.executeQuery(query, { "companyId": companyId});
    return list;
  }
  catch(err){
    console.error("Could not retrieve company integrations list. Error - " + err.message);
  }
};
CompanyIntegrationContext.getCompanyIntegrationsList = getCompanyIntegrationsList;

module.exports = CompanyIntegrationContext;
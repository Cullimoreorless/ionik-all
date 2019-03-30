const express = require('express');
const router = express.Router();
const CRUDContext = require('./../db/crud.service');
const companyContext = new CRUDContext('company');
const companyIntegrationsContext = new CRUDContext('companyIntegration');


router.get('/getCompany/:companyId', async (req,res) => {
  ///get company
  let company = await companyContext.getById({
    "companyid": req.params.companyId
  })
  res.send(company)
});

router.post('/saveCompany', async (req, res) =>{
  let upsertedCompany = await companyService.upsertCompany(req.body);
  res.send( upsertedCompany )
});

router.get('/companyIntegrations/:companyId', async (req, res) => {
  let integrations = await companyIntegrationsContext.findAllByCondition({companyid:req.params.companyId})
  res.send(integrations);
});

router.post('/saveCompanyIntegrations', async (req, res) => {
  let savedIntegrations = [];
  for(let integration of req.body.integrations){
    let savedIntegration = await companyIntegrationsContext.upsert(integration)
    savedIntegrations.push(savedIntegration)
  }
  res.send(savedIntegrations);
});

router.get('/all', async (req, res) => {
  let companies = await companyContext.findAll();
  res.send(companies);
})

let companyService = {
  upsertCompany: async (companyDetails) =>{
    let result = null;
    try{
      result = await companyContext.upsert(companyDetails)
    }
    catch(err){
      console.error(err);
    }
    return result;
  }
}

module.exports = router;
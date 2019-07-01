const express = require('express');
const router = express.Router();
const CRUDContext = require('./../db/crud.service');
const companyContext = new CRUDContext('company');
const companyIntegrationsContext = require('./../db/crud-overrides/companyintegrationcontext');
const adminService = require('./../db/admin.service');

router.get('/getCompany', async (req,res) => {
  let company = await companyContext.getById({
    "companyid": req.companyId
  });
  res.send(company)
});

router.post('/saveCompany', async (req, res) =>{
  let upsertedCompany = await companyService.upsertCompany(req.body);
  res.send( upsertedCompany )
});

router.get('/companyIntegrations', async (req, res) => {
  if(req.params && req.companyId) {
    const existingIntegrations = await adminService.getCompanyIntegrations(req.companyId);
    res.send(existingIntegrations);
  }
  else {
    res.send([]);
  }
  // let integrations = await companyIntegrationsContext.findAllByCondition({companyid:req.companyId})
  // res.send(integrations);
});

router.post('/saveCompanyIntegrations', async (req, res) => {
  let savedIntegrations = [];
  for(let integration of req.body.integrations){
    integration.companyid = req.companyId;
    let savedIntegration = await companyIntegrationsContext.upsert(integration)
    savedIntegrations.push(savedIntegration)
  }
  res.send(savedIntegrations);
});

router.get('/removeCompanyIntegration/:companyIntegrationId', async (req, res) => {
  if(!req.params.companyIntegrationId){
    res.send({success:false, message: "No company integration provided"})
  }
  let deletionResult = await companyIntegrationsContext.delete({companyintegrationid: req.params.companyIntegrationId})
  res.send(deletionResult);
});

router.get('/listCompanyIntegrations', async (req, res) => {
  let integrations = await companyIntegrationsContext.getCompanyIntegrationsList(req.companyId);
  res.send(integrations)
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

const express = require('express');
const router = express.Router();
const CRUDContext = require('./../db/crud.service');
const companyContext = new CRUDContext('company');

router.get('/getCompany/:companyId', async (req,res) => {
  ///get company
  res.send({
    companyid:1, companycode:"code", companyname:"name"
  })
});

router.post('/saveCompany', async (req, res) =>{
  console.log(req.body);

  let upsertedCompany = await companyService.upsertCompany(req.body);
  res.send( upsertedCompany )
});

router.get('/companyIntegrations/:companyId', async (req, res) => {

});

router.post('/saveCompanyIntegrations', async (req, res) => {

});

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
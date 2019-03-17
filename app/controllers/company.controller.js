const express = require('express');
const router = express.Router();
const DBHelper = require('../db/db.service')

router.get('/what/:companyId', async (req,res) => {
  ///get company
  console.log(req.params.companyId)
});

router.post('/saveCompany', async (req, res) =>{
  console.log(req.body);

  let upsertedCompany = companyService.upsertCompany(req.body);
  res.send( req.body )
});

router.get('/companyIntegrations/:companyId', async (req, res) => {

});

router.post('/saveCompanyIntegrations', async (req, res) => {

});

let companyService = {
  upsertCompany: async (companyDetails) =>{
    try{
      await DBHelper.insertToTable('company_name', companyDetails);
    }
    catch(err){
      console.error(err);
    }
  }
}

module.exports = router;
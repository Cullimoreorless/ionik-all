
const express = require('express');
const router = express.Router();
const adminService = require('../db/admin.service');
const middleware = require('../middleware/auth.middleware');

router.use(middleware.checkForRole('SystemAdmin'));

router.get('/getCompanies', async(req, res) => {
    const companies = await adminService.getCompanies();
    console.log(companies);
    res.send(companies);
});

router.get('/getUnassociatedIntegrations', async (req, res) => {
    const integrations = await adminService.getUnassociatedIntegrations();
    console.log(integrations)
    res.send(integrations);
});

router.get('/getCompanyIntegrations/:companyId', async (req, res) => {
    if(req.params && req.params.companyId) {
        const existingIntegrations = await adminService.getCompanyIntegrations(req.params.companyId);
        res.send(existingIntegrations);
    }
    else {
        res.send([]);
    }
});

router.post('/saveCompanyAssociation', async (req, res) => {
    const result = await adminService.saveCompanyAssociation(req.body);
    res.send(result);
});

router.post('/deassociateIntegration', async (req, res) => {
   const result = await adminService.deassociateIntegration(req.body);
   res.send(result);
});

module.exports = router;


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

module.exports = router;

const express = require('express');
const router = express.Router();

const copyService = require('./../db/copy.service');


router.get('/getUsers/:companyIntegrationId', async (req, res) => {
    if(req.params.companyIntegrationId)
    {

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-disposition', 'attachment; filename=users.csv');

        let stream = await copyService.getCopyStream(`copy (select 
 max(regexp_replace('siamo-11', '[^0-9]','','g')) over (partition by cid.companyid),
 coalesce(pinf.personcode, cn.companycode || '-' || 1) as "Person Identifier",
 pid.systemname as "Integration Identifier",
 pinf.firstname as "First Name",
 pinf.lastname as "Last Name",
 pinf.gender as "Gender",
 pinf.email as "Email"
from person_identifier pid 
join company_identifier cid 
 on cid.companyidentifierid = pid.companyidentifierid
    and cid.companyidentifierid = ${req.params.companyIntegrationId}
join company_name cn 
 on cn.companyid = cid.companyid
left join person_information pinf 
 on pinf.personid = pid.personid) to stdout with csv header;`, res);
        console.log('this strea', stream);
        stream.pipe(res);
    }
    // res.sendStatus(200);
});


module.exports = router;

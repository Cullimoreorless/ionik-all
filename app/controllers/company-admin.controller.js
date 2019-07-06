const express = require('express');
const router = express.Router();

const copyService = require('./../db/copy.service');

const moment = require('moment');
const fs = require('fs');

router.get('/getUsers/:companyIntegrationId', async (req, res) => {
    if(req.params.companyIntegrationId)
    {

        try {
            let currentDate = moment();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=SiamoUsers.csv');
            res.setHeader('File-Name', `Siamo-Users-${currentDate.format('MM-DD-YYYY')}.csv`);

            let stream = await copyService.getCopyStream(`copy (
                        select 
                              case when (pinf.personcode is not null) then 'Existing code (do not change)'
                              else 'New person, change to new unique identifier if desired' end as "Identifier Message",
                              coalesce(pinf.personcode, pid.systemname ||'@'|| cn.companycode) as "Person Identifier",
                              pid.systemname as "Integration Identifier",
                              st.systemtypedesc as "Integration Type",
                              pinf.firstname as "First Name",
                              pinf.lastname as "Last Name",
                              pinf.gender as "Gender",
                              pinf.email as "Email"
                            from person_identifier pid 
                            join company_identifier cid 
                              on cid.companyidentifierid = pid.companyidentifierid
                                and cid.companyidentifierid = ${+req.params.companyIntegrationId}
                            join system_type st 
                              on st.systemtypeid = cid.systemtypeid
                            join company_name cn 
                              on cn.companyid = cid.companyid
                            left join person_information pinf 
                              on pinf.personid = pid.personid ) to stdout with csv header;`);
            stream.pipe(res);
        }
        catch (e) {
            console.log('getUsers error - ', e.message)
        }

    }
    // res.sendStatus(200);
});

router.post('/uploadUsers', async (req, res) => {
    if(req.files && req.files.userFile) {
        try {
            let savePath = `${__dirname}/../uploads`;
            if(!fs.existsSync(savePath))
            {
                fs.mkdirSync(savePath)
            }
            savePath += `/${req.companyId}`;
            if(!fs.existsSync(savePath))
            {
                fs.mkdirSync(savePath);
            }
            req.files.userFile.mv(`${__dirname}/../uploads/${req.companyId}/${req.files.userFile.name}`, (err) => {
                if (err) {
                    res.status(500).send(err);
                }
                res.send({success: true, message: 'file uploaded'});
            });
        }
        catch(error){
            res.status(500).send(error);
        }
    }
    else
    {
        req.status(500).send('File not detected');
    }
});


module.exports = router;

const express = require('express');
const router = express.Router();
const companyIntegrationsContext = require('./../db/crud-overrides/companyintegrationcontext');

const copyService = require('./../db/copy.service');

const moment = require('moment');
const fs = require('fs');
const db = require('../db/db.service');


router.get('/listCompanyIntegrations', async (req, res) => {
    let integrations = await companyIntegrationsContext.getCompanyIntegrationsList(req.companyId);
    res.send(integrations)
});

router.get('/getCompanyEmployees', async (req, res) => {
    let employees = await db.executeQuery(
        'select personid as id, coalesce(firstname,\'\') || \' \' || coalesce(lastname,\'\') as "fullName" from person_information');
    res.send(employees);
});


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
                              pinf.email as "Email",
                              pinf.birthday as "Birthday"
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

const getUploadPath = (file, companyId) => {

    let savePath = `${__dirname}/../uploads`;
    if(!fs.existsSync(savePath))
    {
        fs.mkdirSync(savePath)
    }
    savePath += `/${companyId}`;
    if(!fs.existsSync(savePath))
    {
        fs.mkdirSync(savePath);
    }
    return `${__dirname}/../uploads/${companyId}/${file.name}`;
};

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
            const fullPathWithFile = `${__dirname}/../uploads/${req.companyId}/${req.files.userFile.name}`;
            req.files.userFile.mv(fullPathWithFile, async (err) => {
                if (err) {
                    res.status(500).send(err);
                }
                try {
                    let copyRes = await copyService.copyFileIntoDB(fullPathWithFile, 'stg.stg_demographic_information');
                    console.log(copyRes);
                    await db.executeQuery("select public.update_demographic_information();",[]);
                }
                catch(error){
                    res.status(500).send(error);
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


router.get('/downloadUserGroups', async (req, res) => {
    try {
        const currentDate = moment();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=SiamoUsers.csv');
        res.setHeader('File-Name', `Siamo-User-Groups-${currentDate.format('MM-DD-YYYY')}.csv`);

        let stream = await copyService.getCopyStream(`copy (
                            select pinfo.personcode as "Person Code (DO NOT CHANGE)",
                               coalesce(grps.grouptype, 'Location') as "Type (examples: Location, Department, Project Team...)",
                               coalesce(grps.groupcode, 'ExampleCode') as "Code",
                               coalesce(grps.groupname, 'Example Name') as "Name",
                               coalesce(grps.startdate, '1990-01-01') as "Start Date"
                            from person_information pinfo
                            left join (select personid, companyid, 'Location' as grouptype, 
                                  locationcode as groupcode, 
                                  locationname as groupname,
                                  to_char(startdate, 'YYYY-mm-dd') as startdate
                               from public.person_location
                               where companyid = ${+req.companyId}
                                  union 
                                  select personid, companyid, grouptype, groupcode, groupname,
                                  to_char(startdate, 'YYYY-mm-dd') as startdate
                                from public.person_group
                                where companyid = ${+req.companyId}) grps on grps.personid = pinfo.personid
                                  where pinfo.companyid = ${+req.companyId}  ) to stdout with csv header;`);
        stream.pipe(res);
    }
    catch(error){
        console.error('downloadUserGroups - ', error);
    }

});

router.post('/uploadUserGroups', async (req, res) => {
    if(req.files && req.files.userGroupFile) {
        try
        {
            const filePath = getUploadPath(req.files.userGroupFile, req.companyId);
            console.log('filePath', filePath);
            req.files.userGroupFile.mv(filePath, async (error) => {
                if(error)
                {
                    console.error('User Groups File upload save error - ', error);
                    res.status(500).send("Could not save file - " + error);
                }
                try
                {
                    let tableName = 'stg.temp_import_' + moment().unix();
                    let createQuery = `create table ${tableName} (personcode varchar(200), grouptype varchar(50), groupcode varchar(35), groupname varchar(150), startdate date)`;
                    let createRes =await db.executeQuery(createQuery, []);

                    let copyRes = await copyService.copyFileIntoDB(filePath, tableName);

                    let importQuery = await db.executeQuery('select public.import_person_group(:tableName, :companyId);',
                        {tableName:tableName, companyId:req.companyId});
                    let deleteQuery = await db.executeQuery('drop table if exists ' + tableName);
                    res.send({'uploaded':'uploaded'})
                }
                catch(copyError)
                {
                    console.error('Could not save User Group File information', copyError);
                    res.status(500).send("Could not save User Group File information")
                }
            })
        }
        catch(error)
        {
            console.error('Could not upload user group info', error)
        }
    }
    else
    {
        req.status(500).send('File not detected');
    }
});


module.exports = router;

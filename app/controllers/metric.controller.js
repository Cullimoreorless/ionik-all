const express = require('express');
const router = express.Router();

const db = require('./../db/db.service');

router.get('/getMessageData', async(req, res) => {
   try{
       let results = await db.executeQuery('select * from vw_send_messages_by_date where companyid = :companyId', {companyId: req.companyId});
       res.send(results);
   }
   catch(e)
   {
       console.error('getMessageData - ', e)
   }
});

module.exports = router;

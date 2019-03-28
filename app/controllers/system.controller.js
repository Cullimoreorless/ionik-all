const express = require('express')
const router = express.Router();
const CRUDContext = require('./../db/crud.service');
const systemTypeContext = new CRUDContext('systemType');



router.get('/types', async (req, res) => {
  let types = await systemTypeContext.findAll();
  res.send(types);
})


module.exports = router
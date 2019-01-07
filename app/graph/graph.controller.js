const express = require('express');
const router = express.Router();

const db = require('./graph.db');

router.get("/getData", async (req, res) => {
  res.render("index")
});

router.get("/getGraphData", async (req, res) => {
  //let dbRes = await db.executeQuery(db.queries.getGraphData,[]);
  let dbRes = await db.executeQuery(db.queries.getCompanyGraphData, [])
  // console.log(dbRes.rows[0]);
  res.send(dbRes.rows[0])
})

module.exports = router;
let DBHelper = require('./db.service');


//TODO: consider the difficulty of connecting front end to tables?
let CRUDHelpers = {
  "company":{
    tableName:"company_name", 
    idColumns:["companyid"], 
    updateCols:["companycode","companyname"]},
  "companyIntegration":{
    tableName:"company_integration", 
    idColumns:["companyintegrationid", "companyid","systemtypeid"],
    updateCols:["integrationidentifier"]}
}

function CRUDContext(contextId){
  this.ctx = CRUDHelpers[contextId];
  this.dbHelper = DBHelper;
}

CRUDContext.prototype.separateColumns = (columnVals) =>{
  let result = {
    idValues:{},
    updateValues:{}
  }
  for(key in columnVals){
    if(this.ctx.idColumns.includes(key)){
      result.idValues[key] = columnVals[key];
    }
    if(this.ctx.updateCols.includes(key)){
      result.updateValues[key] = columnVals[key];
    }
  }
  return result;
}

CRUDContext.prototype.upsert = async (upsertInfo) =>{
  let cols = this.separateColumns(upsertInfo);
  let result = null;
  let existingRow = await DBHelper.findFirstById(this.ctx.tableName, cols.idValues);
  if(!existingRow){
    result = await DBHelper.insertToTable(this.ctx.tableName, cols.updateValues)
  } 
  else{
    result = await DBHelper.updateById(this.ctx.tableName, cols.idValues, cols.updateValues);
  }
  return result;
}


module.exports = CRUDContext
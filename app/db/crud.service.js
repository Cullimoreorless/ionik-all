let DBHelper = require('./db.service');

let CRUDHelpers = {
  "company":{
    tableName:"company_name", 
    idColumns:["companyid"], 
    updateCols:["companycode","companyname"]},
  "companyIntegration":{
    tableName:"company_integration", 
    idColumns:["companyintegrationid"],
    updateCols:["integrationidentifier", "companyid","systemtypeid"]},
  "systemType":{
    tableName:"system_type",
    idColumns:["systemtypeid"],
    updateCols:["systemtypedesc"]
  },
  "user":{
    tableName:"app_user",
    idColumns:["userid"],
    updateCols:["pwhash","username","companyid"]
  }
}

function CRUDContext(contextId){
  this.ctx = CRUDHelpers[contextId];
  this.dbHelper = DBHelper;

  this.findAll = async() =>{
    try{
      let rows = DBHelper.findAll(this.ctx.tableName);
      if(!rows || rows.length < 1){
        throw new Error(`CRUDContext.findAll - Could not retrieve ${this.ctx.tableName} records`)
      }
      return rows;
    }
    catch(err){
      console.error(err);
    }
  }

  this.findAllByCondition= async(condition) =>{
    try{
      let cols = this.separateColumns();
      let rows = await DBHelper.findAllByCondition(this.ctx.tableName, condition, cols.allCols);
      if(!rows || rows.length < 1){
        throw new Error(`CRUDContext.findAllByCondition - Could not retrieve ${this.ctx.tableName} records for contiditon ${JSON.stringify(condition)}`)
      }
      return rows;
    }
    catch(err){
      console.error(err);
    }
  }

  this.getById = async (idValues)=> {
    let cols = this.separateColumns(idValues);
    try{
      let rows = await DBHelper.findFirstById(this.ctx.tableName, cols.idValues, cols.allCols);
      if(!rows || rows.length < 1){
        throw new Error('CRUDContext.getById - DB ping successful, could not find row')
      }
      return rows[0];
    }
    catch(err){
      console.error(`Could not retrieve ${this.ctx.tableName} for id: ${JSON.stringify(idValues)}. Error: ${err}`)
    }
  }

  this.upsert = async (upsertInfo) =>{
    let cols = this.separateColumns(upsertInfo);
    let result = null;
    let existingRow = null;
    if(cols.idValues){
      existingRow = await DBHelper.findFirstById(this.ctx.tableName, cols.idValues, cols.allCols);
    }
    if(!existingRow){
      cols.updateValues.createts = DBHelper.currentts;
      result = await DBHelper.insertToTable(this.ctx.tableName, cols.updateValues, cols.allCols);
    } 
    else{
      cols.updateValues.updatets = DBHelper.currentts;
      result = await DBHelper.updateById(this.ctx.tableName, cols.idValues, cols.updateValues, cols.allCols);
    }
    return result[0];
  };

  this.separateColumns = (columnVals) =>{
    let result = {
      idValues:null,
      updateValues:{},
      allCols:[]
    }
    if(columnVals){
      for(key in columnVals){
        if(this.ctx.idColumns.includes(key) && columnVals[key]){
          result.idValues = result.idValues || {};
          result.idValues[key] = columnVals[key];
        }
        if(this.ctx.updateCols.includes(key)){
          result.updateValues[key] = columnVals[key];
        }
      }
    }
    result.allCols = this.ctx.idColumns.concat(this.ctx.updateCols)
    return result;
  }
}



module.exports = CRUDContext
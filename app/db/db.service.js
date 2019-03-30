const dbConn = {
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
}; 
const knex = require('knex')({
  client:'pg',
  connection: dbConn
});

const DBHelper = {
  currentts: knex.fn.now(),
  insertToTable: async (tableName, insCols, columns) => {
    return knex(tableName).insert(insCols).returning(columns);
  },
  findFirstById: async (tableName, idValue, columns) => {
    return knex(tableName).where(idValue).limit(1).select(columns);
  },
  updateById: async (tableName, idValue, updateValues, columns) => {
    return knex(tableName).where(idValue).update(updateValues).returning(columns);
  },
  findAllByCondition: async(tableName, condition, columns) =>{
    return knex(tableName).where(condition).select(columns);
  },
  findAll: async(tableName) =>{
    return knex(tableName).select('*');
  },


  findCompanyByCode: async (companyCode) => {
    return knex('company_name').where({"companycode":companyCode}).limit(1).select(["companyid", "companycode", "companyname"]);
  },
  findCompanies: async () => {
    return knex('company_name').select(["companyid", "companycode", "companyname"])
  }
}

module.exports = DBHelper;
const dbConn = {
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
}; 
const {Client} = require('pg-parameters');
const knex = require('knex')({
  client:'pg',
  connection: dbConn
});
const dbClient = new Client(dbConn);

const DBHelper = {
  currentts: knex.fn.now(),
  insertToTable: async (tableName, insCols, columns) => {
    return knex(tableName).insert(insCols).returning(columns);
  },
  findFirstById: async (tableName, idValue, columns) => {
    return knex(tableName).whereNull('endts').where(idValue).limit(1).select(columns);
  },
  updateById: async (tableName, idValue, updateValues, columns) => {
    return knex(tableName).whereNull('endts').where(idValue).update(updateValues).returning(columns);
  },
  findAllByCondition: async(tableName, condition, columns) =>{
    return knex(tableName).whereNull('endts').where(condition).select(columns);
  },
  findAll: async(tableName) =>{
    return knex(tableName).whereNull('endts').select('*');
  },
  deleteById:async(tableName, idInfo) =>{
    return knex(tableName).where(idInfo).update({'endts':knex.fn.now()}).returning("*");
  },

  findCompanyByCode: async (companyCode) => {
    return knex('company_name').where({"companycode":companyCode}).limit(1).select(["companyid", "companycode", "companyname"]);
  },
  findCompanies: async () => {
    return knex('company_name').select(["companyid", "companycode", "companyname"])
  },

  
  executeQuery: async(query, params) =>{
    try{
      const res = await dbClient.query(query, params);
      return res;
    }
    catch(err)
    {
      console.error('Sql error - ', err)
    }
  }
};

module.exports = DBHelper;

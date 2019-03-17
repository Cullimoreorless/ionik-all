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
  insertToTable: async (tableName, columns) => {
    // let finalColumns = {};
    // for(key in columns){
    //   finalColumns[key.toLowerCase()] = columns[key];
    // }
    return knex(tableName).insert(finalColumns).returning('*');
  },
  findFirstById: async (tableName, idValue) => {
    return knex(tableName).where(idValue).limit(1).select('*');
  },
  updateById: async (tableName, idValue, updateValues) => {
    return knex(tableName).where(idValue).update(updateValues).returning("*");
  }

  

}

module.exports = DBHelper;
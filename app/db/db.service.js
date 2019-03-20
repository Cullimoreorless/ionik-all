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
  findFirstById: async (tableName, idValue) => {
    return knex(tableName).where(idValue).limit(1).select('*');
  },
  updateById: async (tableName, idValue, updateValues, columns) => {
    return knex(tableName).where(idValue).update(updateValues).returning(columns);
  }

  

}

module.exports = DBHelper;
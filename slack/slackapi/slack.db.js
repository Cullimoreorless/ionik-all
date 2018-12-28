const {Client, Pool} = require('pg')
const dbClient = new Pool({
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
});

const queries = {
  saveUsers : "insert into stg.slack_users VALUES ($1)",
  saveMessages : "insert into stg.slack_messages VALUES ($1,$2)",
  saveChannelDetails : "insert into stg.slack_channels VALUES ($1,$2,$3)",
  saveChannelMembers : "insert into stg.slack_channel_members VALUES ($1, $2)",
  getCompanyIdentifier: "select * from company_identifiers where systemid = $1",
  insertCompanyIdentifier:"insert into company_identifiers VALUES (1,1,$1,$2, now())",
  updateCompanyIdentifier:`update company_identifiers 
  set lastretrieved = now(), name = $1
  WHERE systemid = $2`
};

let execute = async (query,params) => {
  if(!(params instanceof Array)){
    params = [params];
  }
  console.log("Ionik - executing " + query)
  const res = await dbClient.query(query, params) 
  console.log("Complete!")
  return res;
};

const db = {
  queries: queries,
  executeQuery : execute
}

module.exports=db;
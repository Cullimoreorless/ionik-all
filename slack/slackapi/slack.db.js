const {Client, Pool} = require('pg')
const dbClient = new Pool({
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
});

const queries = {
  saveUsers : "insert into stg.slack_user (userdata, transactionuuid) VALUES ($1,$2)",
  saveMessages : "insert into stg.slack_message (channelid, messagedata, transactionuuid) VALUES ($1,$2,$3)",
  saveChannelDetails : "insert into stg.slack_channel (channelid, numberofmembers, transactionuuid) VALUES ($1,$2,$3)",
  saveChannelMembers : "insert into stg.slack_channel_member (channelid, memberlist,transactionuuid) VALUES ($1, $2, $3)",
  saveWorkspace: `insert into stg.slack_workspace (teamid, name, domain, transactionuuid)  VALUES ( $1,$2,$3,$4)`,
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
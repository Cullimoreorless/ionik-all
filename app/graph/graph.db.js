const {Pool} = require('pg')
const dbClient = new Pool({
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
});

const queries = {
  getGraphData:`select json_agg(base) as graphlinks from (
    select sender.systemrealname as source,
      recipient.systemrealname as target,
      numberofinteractions as weight
    from (select senderid, recipientid, sum(1.00/totalnumofrecipients) as numberofinteractions
    from message_info
    group by senderid, recipientid) msgs 
    join (
    select personidentifierid, systemrealname
    from person_identifier) sender
      on sender.personidentifierid = msgs.senderid
    join (
    select personidentifierid, systemrealname 
    from person_identifier) recipient
      on recipient.personidentifierid = msgs.recipientid) base`
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
const {Pool} = require('pg')
const dbClient = new Pool({
  user:process.env.IONIKDBUSER,
  password:process.env.IONIKDBPASSWORD,
  host:process.env.IONIKDBHOST,
  database:process.env.IONIKDBDATABASE,
  port:process.env.IONIKDBPORT
});

const queries = {
  getGraphData:`select json_agg(allrecs) as graphlinks
  from (select source, target, name,
    round(normalize_and_scale(totalsentinteractions, mintotalinteractions, maxtotalinteractions, 6,16),2) normalizedtotalinteractions,
    round(normalize_and_scale(weight, minweight, maxweight, 1.5, 5),2) normalizedweight
  from (
  select 
    source, target, weight, totalsentinteractions, name, 
    min(totalsentinteractions) over (order by constant) as mintotalinteractions,
    max(totalsentinteractions) over (order by constant) as maxtotalinteractions,
    min(weight) over (order by constant) as minweight,
    max(weight) over (order by constant) as maxweight
  from (
  select 1 as constant, sender.systemrealname as source,
     sender.systemrealname as name,
    recipient.systemrealname as target,
    numberofinteractions as weight,
    sum(numberofinteractions) over (partition by sender.systemrealname) as totalsentinteractions
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
    on recipient.personidentifierid = msgs.recipientid
  where numberofinteractions >=3
  union 
  select 1, systemrealname, systemrealname, null, null, null 
  from person_identifier pid where not exists (select 1
  from message_info cm where senderid = pid.personidentifierid)) fields
  ) aggregated
  ) allrecs`
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
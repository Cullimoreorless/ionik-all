COPY (select cid.systemname, pid.* from person_identifier pid 
  join company_identifier cid on cid.companyidentifierid = pid.companyidentifierid) TO '/Users/hoseratheart/ionik/database/graph/people.csv' with csv header;
copy (select senderid, recipientid, sum(1.00/totalnumofrecipients) as numberofinteractions
from message_info
group by senderid, recipientid) to '/Users/hoseratheart/ionik/database/graph/messages.csv' with csv header;

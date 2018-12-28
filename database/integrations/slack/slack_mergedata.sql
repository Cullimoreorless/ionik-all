--upsert company identifiers from slack (workspaces)
update company_identifier
set systemname = stg.name,
	systemdomain = stg.domain, 
	lastretrievedutc = (now()::timestamp at time zone 'utc')
from (select * from stg.slack_workspace) stg
where stg.teamid = company_identifier.systemid;

insert into company_identifier (systemtypeid, systemid, systemname, systemdomain, lastretrievedutc) 
select (select systemtypeid from system_type where systemtypedesc = 'Slack' limit 1),
	teamid, name, domain, now() at time zone 'utc'
from stg.slack_workspace sw
where not exists (select 1 from company_identifier as cid 
where cid.systemid = sw.teamid);
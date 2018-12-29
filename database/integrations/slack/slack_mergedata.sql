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

--slack users
update person_identifier
	set systemname = stg.systemname,
		systemrealname = stg.friendlyname,
		systemtimezoneoffset = stg.timezoneoffset,
		systemtimezonename = stg.timezonename, 
		systemlocation = stg.timezone, 
		systemupdatetsutc = stg.utcupdatets, 
		isactive = stg.isactive
from (select cid.companyidentifierid,
	(select systemtypeid from system_type where systemtypedesc = 'Slack'),
    users.systemid, users.systemname, friendlyname, timezoneoffset, 
    timezonename, timezone, utcupdatets, not isdeleted as isactive
from company_identifier as cid 
join (
select userdata#>>'{"id"}' as systemid,
	userdata#>>'{"name"}' as systemname, 
	userdata#>>'{"tz_label"}' as timezonename, 
	userdata#>>'{"tz"}' as timezone, 
	userdata#>>'{"real_name"}' as friendlyname,
	(userdata#>>'{"tz_offset"}')::int as timezoneoffset,
	(userdata#>>'{"tz_offset"}')::interval as timezoneoffsetinterval,
	userdata#>>'{"team_id"}' as teamid,
	(userdata#>>'{"deleted"}')::boolean as isdeleted,
	to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' as utcupdatets,
	(to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' + (userdata#>>'{"tz_offset"}')::interval) as localupdatets,
	* 
from ( 
select jsonb_array_elements((userdata::jsonb#>>'{"members"}')::jsonb) as userdata
from stg.slack_user
where (userdata::jsonb#>>'{"members"}') is not null ) base ) users
on users.teamid = cid.systemid) stg
where stg.systemid = person_identifier.systemid 
	and stg.companyidentifierid = person_identifier.companyidentifierid
	and (person_identifier.systemname <> stg.systemname or
		person_identifier.systemrealname <> stg.friendlyname or
		person_identifier.systemtimezoneoffset <> stg.timezoneoffset or
		person_identifier.systemtimezonename <> stg.timezonename or 
		person_identifier.systemlocation <> stg.timezone or  
		person_identifier.systemupdatetsutc <> stg.utcupdatets or  
		person_identifier.isactive <> stg.isactive);

insert into person_identifier (companyidentifierid, systemtypeid,
	systemid,systemname, systemrealname, systemtimezoneoffset,
	systemtimezonename, systemlocation, systemupdatetsutc, isactive)
select cid.companyidentifierid,
	(select systemtypeid from system_type where systemtypedesc = 'Slack'),
    users.systemid, users.systemname, friendlyname, timezoneoffset, 
    timezonename, timezone, utcupdatets, not isdeleted as isactive
from company_identifier as cid 
join (
select userdata#>>'{"id"}' as systemid,
	userdata#>>'{"name"}' as systemname, 
	userdata#>>'{"tz_label"}' as timezonename, 
	userdata#>>'{"tz"}' as timezone, 
	userdata#>>'{"real_name"}' as friendlyname,
	(userdata#>>'{"tz_offset"}')::int as timezoneoffset,
	(userdata#>>'{"tz_offset"}')::interval as timezoneoffsetinterval,
	userdata#>>'{"team_id"}' as teamid,
	(userdata#>>'{"deleted"}')::boolean as isdeleted,
	to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' as utcupdatets,
	(to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' + (userdata#>>'{"tz_offset"}')::interval) as localupdatets,
	* 
from ( 
select jsonb_array_elements((userdata::jsonb#>>'{"members"}')::jsonb) as userdata
from stg.slack_user
where (userdata::jsonb#>>'{"members"}') is not null ) base ) users
on users.teamid = cid.systemid
where not exists (select 1 from person_identifier pid
where pid.systemid = users.systemid and cid.companyidentifierid = pid.companyidentifierid);



update conversation
set updatetsutc = now() at time zone 'utc'
from (
select distinct sc.channelid, cid.companyidentifierid from stg.slack_channel sc 
join stg.slack_workspace sw 
	on sw.transactionuuid = sc.transactionuuid
join company_identifier cid 
	on cid.systemid = sw.teamid) base
where base.channelid = conversation.systemid
	and base.companyidentifierid = conversation.companyidentifierid;

insert into conversation (systemid, companyidentifierid, createtsutc, updatetsutc)
select distinct sc.channelid, cid.companyidentifierid, 
	now() at time zone 'utc' as createtsutc,  
	now() at time zone 'utc' as updatetsutc
from stg.slack_channel sc 
join stg.slack_workspace sw 
	on sw.transactionuuid = sc.transactionuuid
join company_identifier cid 
	on cid.systemid = sw.teamid;


  update conversation_member
set updatetsutc = now() at time zone 'utc',
	isactive = true
from (select conv.conversationid, pid.personidentifierid, true as isactive
from  (
	select sc.channelid, cid.companyidentifierid, 
		replace(jsonb_array_elements(scm.memberlist::jsonb)::text,'"','') as userid
	from stg.slack_channel sc 
	join stg.slack_channel_member scm 
		on scm.channelid = sc.channelid
			and scm.transactionuuid = sc.transactionuuid
	join stg.slack_workspace sw 
		on sw.transactionuuid = sc.transactionuuid
	join company_identifier cid 
		on cid.systemid = sw.teamid) stgconv
join conversation conv 
	on conv.systemid = stgconv.channelid
join person_identifier pid 
	on pid.systemid = stgconv.userid) base
where base.conversationid = conversation_member.conversationid
	and base.personidentifierid = conversation_member.personidentifierid;

insert into conversation_member (conversationid, personidentifierid, isactive, 
	createtsutc, updatetsutc)	 
select conv.conversationid, pid.personidentifierid, true as isactive,
	now() at time zone 'utc',now() at time zone 'utc'
from  (
	select sc.channelid, cid.companyidentifierid, 
		replace(jsonb_array_elements(scm.memberlist::jsonb)::text,'"','') as userid
	from stg.slack_channel sc 
	join stg.slack_channel_member scm 
		on scm.channelid = sc.channelid
			and scm.transactionuuid = sc.transactionuuid
	join stg.slack_workspace sw 
		on sw.transactionuuid = sc.transactionuuid
	join company_identifier cid 
		on cid.systemid = sw.teamid) stgconv
join conversation conv 
	on conv.systemid = stgconv.channelid
join person_identifier pid 
	on pid.systemid = stgconv.userid
where not exists (select 1 from conversation_member cm
	where cm.conversationid = conv.conversationid 
		and cm.personidentifierid = pid.personidentifierid);
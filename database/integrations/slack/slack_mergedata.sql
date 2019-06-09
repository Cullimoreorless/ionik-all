
create or replace function public.slack_merge_data() returns VOID as $$
declare transactionUuids varchar[] = '{}';
declare startunixts decimal ;
declare transactionUuidRecord record;
begin
	startunixts = extract(epoch from now())::decimal;
	for transactionUuidRecord in execute $query$ select array_agg(transactionuuid) as transactionuuids
				from stg.slack_workspace
				where transactionuuid not in (select transactionuuid
				from stg.slack_etl_transactions) $query$ loop
		transactionUuids = transactionUuidRecord.transactionuuids;
	end loop;
	--upsert company identifiers from slack (workspaces)
	update company_identifier
	set systemname = stg.name,
		systemdomain = stg.domain,
		lastretrievedutc = (now()::timestamp at time zone 'utc')
	from (select * from stg.slack_workspace) stg
	where stg.teamid = company_identifier.systemid
		and stg.transactionuuid = any(transactionUuids);

	insert into company_identifier (systemtypeid, systemid, systemname, systemdomain, lastretrievedutc)
	select (select systemtypeid from system_type where systemtypedesc = 'Slack' limit 1),
		teamid, name, domain, now() at time zone 'utc'
	from stg.slack_workspace sw
	where not exists (select 1 from company_identifier as cid
			where cid.systemid = sw.teamid)
		and sw.transactionuuid = any(transactionUuids);

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
	join stg.vw_slack_user_info users
	on users.teamid = cid.systemid
	 where users.transactionuuid = any(transactionUuids)) stg
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
	join stg.vw_slack_user_info users
	on users.teamid = cid.systemid
	where not exists (select 1 from person_identifier pid
	where pid.systemid = users.systemid and cid.companyidentifierid = pid.companyidentifierid)
	 and users.transactionuuid = any(transactionUuids);



	update conversation
	set updatetsutc = now() at time zone 'utc'
	from (
	select distinct sc.channelid, cid.companyidentifierid from stg.slack_channel sc
	join stg.slack_workspace sw
		on sw.transactionuuid = sc.transactionuuid
	join company_identifier cid
		on cid.systemid = sw.teamid
	 where sw.transactionuuid = any(transactionUuids)) base
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
		on cid.systemid = sw.teamid
	 where sc.transactionuuid = any(transactionUuids);


	update conversation_member
	set updatetsutc = now() at time zone 'utc',
		isactive = true
	from (select conv.conversationid, pid.personidentifierid, true as isactive
	from  (
		select scm.transactionuuid, sc.channelid, cid.companyidentifierid,
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
	 	where  stgconv.transactionuuid = any(transactionUuids)) base
	where base.conversationid = conversation_member.conversationid
		and base.personidentifierid = conversation_member.personidentifierid;

	insert into conversation_member (conversationid, personidentifierid, isactive, createtsutc, updatetsutc)
	select conversationid, personidentifierid,true, tsutc, now() at time zone 'utc'  from (
	select channelid, msgjson#>>'{"user"}' as userid,
		to_timestamp(
			split_part((msgjson#>>'{"ts"}')::text,'.',1)::int) at time zone 'utc' as tsutc,
		'join' as type, transactionuuid
	from (
	select transactionuuid, channelid, jsonb_array_elements(messagedata::jsonb) as msgjson
	from stg.slack_message ) jsonmessages
	where msgjson#>>'{"subtype"}' = 'channel_join') joins
	join person_identifier pid
		on pid.systemid = joins.userid
	join conversation conv
		on conv.systemid = joins.channelid
	where not exists (select 1 from conversation_member cm
		where cm.conversationid = conv.conversationid
			and pid.personidentifierid = cm.personidentifierid
			and cm.createtsutc = tsutc)
	 and transactionuuid = any(transactionUuids);

	update conversation_member
	set endtsutc = base.tsutc
	from (
	select existingjoins.conversationmemberid, leaves.tsutc from
		(select transactionuuid, channelid, msgjson#>>'{"user"}' as userid,
		to_timestamp(
			split_part((msgjson#>>'{"ts"}')::text,'.',1)::int) at time zone 'utc' as tsutc from (
		select transactionuuid, channelid, jsonb_array_elements(messagedata::jsonb) as msgjson
		from stg.slack_message ) jsonmessages
	where msgjson#>>'{"subtype"}' = 'channel_leave'
		and transactionuuid = any(transactionUuids)) leaves
	join person_identifier pid
		on pid.systemid = leaves.userid
	join conversation conv
		on conv.systemid = leaves.channelid
	join (select conversationmemberid, conversationid, personidentifierid, createtsutc,
		coalesce(lead(createtsutc) over (partition by conversationid, personidentifierid order by createtsutc),
			'3000-01-01'::timestamp) as nextjoins
	from conversation_member cm ) existingjoins
		on existingjoins.conversationid = conv.conversationid
			and existingjoins.personidentifierid = pid.personidentifierid
			and leaves.tsutc between existingjoins.createtsutc and existingjoins.nextjoins
	where not exists (select 1 from conversation_member cm
		where cm.conversationmemberid = existingjoins.conversationmemberid
			and cm.endtsutc = leaves.tsutc)) base
		where base.conversationmemberid = conversation_member.conversationmemberid;


	insert into sent_message (personidentifierid, conversationid, systemid, messagetsutc,messagetslocal, createtsutc)
	select pid.personidentifierid, conv.conversationid, messageid, messagetsutc,
		messagetsutc + systemtimezoneoffset::text::interval,
		now() at time zone 'utc'
	from (
	select channelid,
		to_timestamp(
			split_part((messagejson#>>'{"ts"}')::text,'.',1)::int) at time zone 'utc' as messagetsutc,
		(messagejson#>>'{"user"}')::text as userid,
		(messagejson#>>'{"client_msg_id"}')::text as messageid,
		messagejson
	from (
	select transactionuuid, channelid, jsonb_array_elements(messagedata::jsonb) as messagejson
	from stg.slack_message) messagejson
	 where transactionuuid = any(transactionUuids)) messages
	join person_identifier pid
		on messages.messageid is not null
			and pid.systemid = messages.userid
	join conversation conv
		on conv.systemid = messages.channelid
	where not exists (select 1 from sent_message sm
	where sm.systemid = messages.messageid);


	insert into message_info (messageid, senderid, recipientid, conversationid,
		totalnumofrecipients, messagetsutc, sendertslocal, recipienttslocal,
		sentoutofworkhours)
	select sm.messageid, sm.personidentifierid as senderid,
		cm.personidentifierid as recipientid, sm.conversationid,
		count(cm.personidentifierid) over (partition by sm.messageid) as totalnumofrecipients,
		sm.messagetsutc, messagetslocal as sendertslocal,
		sm.messagetsutc + recipient.systemtimezoneoffset::text::interval as recipienttslocal,
		is_outside_work_hours(sm.messagetslocal) as sentoutofworkhours
	from sent_message sm
	join conversation_member cm
		on cm.conversationid = sm.conversationid
			and sm.personidentifierid <> cm.personidentifierid
		and sm.messagetsutc between cm.createtsutc and coalesce(cm.endtsutc, '3099-01-01'::timestamp)
	join person_identifier sender
		on sender.personidentifierid = sm.personidentifierid
	join person_identifier recipient
		on recipient.personidentifierid = cm.personidentifierid
	where not exists (select 1 from message_info mi
	where mi.conversationid = cm.conversationid
		and mi.senderid = sender.personidentifierid
		and mi.recipientid = recipient.personidentifierid
		and mi.messageid = sm.messageid);


	insert into stg.slack_etl_transactions
		select unnest(transactionUuids), startunixts, extract(epoch from now()),'';
end;
$$ language plpgsql;

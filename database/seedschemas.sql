
create schema if not exists stg;

--drop table if exists stg.slack_config
create table stg.slack_config
(
	teamid varchar(20),
	transactionid varchar(50),
	executionunixts decimal(18,6)
);

-- drop table if exists stg.slack_user;
create table stg.slack_user
  (
  	slackuserid serial,
  	userdata text,
  	transactionuuid text
  );
  	
-- drop table if exists stg.slack_message;
create table stg.slack_message
  (
  	slackmessageid bigserial,
  	channelid text,
  	messagedata text,
  	transactionuuid text
  );

-- drop table if exists stg.slack_channel;
create table stg.slack_channel
 (
 	slackchannelid bigserial,
 	channelid text,
 	numberofmembers int,
 	transactionuuid text
 );
 

-- drop table if exists stg.slack_channel_member;
create table stg.slack_channel_member
 (
 	slackchannelmembersid bigserial,
 	channelid text,
 	memberlist text,
 	transactionuuid text
 );

--  drop table if exists stg.slack_workspace;
create table stg.slack_workspace
( 
	slackworkspaceid bigserial,
	teamid text,
	name text,
	domain text,
	transactionuuid text
);

create table stg.slack_etl_transactions
(
	transactionuuid varchar(40),
	beginunixts decimal(18,6),
	completedunixts decimal(18,6),
	messages text
);
create or replace view stg.vw_slack_user_info as
select
	transactionuuid,
	userdata#>>'{"id"}' as systemid,
	userdata#>>'{"name"}' as systemname,
	userdata#>>'{"tz_label"}' as timezonename,
	userdata#>>'{"tz"}' as timezone,
	userdata#>>'{"real_name"}' as friendlyname,
	(userdata#>>'{"tz_offset"}')::int as timezoneoffset,
	(userdata#>>'{"tz_offset"}')::interval as timezoneoffsetinterval,
	userdata#>>'{"team_id"}' as teamid,
	(userdata#>>'{"deleted"}')::boolean as isdeleted,
	(userdata#>>'{"is_bot"}')::boolean as isbot,
	(userdata#>>'{"profile","first_name"}') as firstname,
	(userdata#>>'{"profile","last_name"}') as lastname,
	(userdata#>>'{"profile","email"}') as email,
	(userdata#>>'{"profile","image_32"}') as imageurl,

	to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' as utcupdatets,
	(to_timestamp((userdata#>>'{"updated"}')::bigint) at time zone 'utc' + (userdata#>>'{"tz_offset"}')::interval) as localupdatets
from (
select jsonb_array_elements(userdata::jsonb) as userdata, transactionuuid
from stg.slack_user ) base ;


--SCHEMA: public

drop table if exists system_type;
create table system_type
(
	systemtypeid serial primary key,
	systemtypedesc varchar(100)
);

insert into system_type (systemtypedesc) values ('Siamo');
insert into system_type (systemtypedesc) values ('Slack');
insert into system_type (systemtypedesc) values ('Outlook Mail');

drop table if exists company_name;
create table company_name(
  companyid serial primary key,
  companycode varchar(10),
  companyname text,
  createts timestamp, 
  updatets timestamp,
  endts timestamp
);

--select * from company_integration
drop table if exists company_integration;
create table company_integration(
  companyintegrationid serial,
  companyid int,
	foreign key (companyid) references company_name (companyid),
  systemtypeid int,
	foreign key (systemtypeid) references system_type (systemtypeid),
  integrationidentifier text,
  systemid text,
  lastretrievedutc timestamp,
  createts timestamp, 
  updatets timestamp,
  endts timestamp
	
);

drop table if exists company_identifier;
create table company_identifier (
  companyidentifierid serial primary key, 
  systemtypeid int,
  systemid text,
  systemname text,
  systemdomain text, 
  lastretrievedutc timestamp, 
  foreign key (systemtypeid) references system_type(systemtypeid)
);

drop table if exists person_identifier;
create table person_identifier
(
  personidentifierid bigserial primary key,
  companyidentifierid int,
  systemtypeid int,
  systemid text,
  systemname text,
  systemrealname text,
  systemtimezoneoffset int,
  systemtimezonename text,
  systemlocation text,
  systemupdatetsutc timestamp,
  isactive boolean,
  foreign key (companyidentifierid) references company_identifier(companyidentifierid),
  foreign key (systemtypeid) references system_type(systemtypeid)
);

drop table if exists conversation;
create table conversation
(
	conversationid bigserial primary key,
	companyidentifierid int,
	systemid text,
	createtsutc timestamp,
	updatetsutc timestamp,
	foreign key (companyidentifierid) references company_identifier(companyidentifierid)
);

drop table if exists conversation_member;
create table conversation_member
(
	conversationmemberid bigserial primary key,
	conversationid bigint,
	personidentifierid int,
	isactive boolean,
	createtsutc timestamp,
	updatetsutc timestamp,
	endtsutc timestamp,
	foreign key (conversationid) references conversation(conversationid),
	foreign key (personidentifierid) references person_identifier(personidentifierid)
);

drop table if exists sent_message;
create table sent_message
(
	messageid bigserial primary key,
	personidentifierid int,
	conversationid bigint,
	systemid text,
	messagetsutc timestamp,
	messagetslocal timestamp,
	createtsutc timestamp
);

drop table if exists message_info;
create table message_info
(
  messageinfoid bigserial primary key,
  messageid bigint,
  senderid int,
  recipientid int,
  conversationid bigint,
  totalnumofrecipients int,
  messagetsutc timestamp,
  sendertslocal timestamp,
  recipienttslocal timestamp,
  sentoutofworkhours boolean,
  foreign key (messageid) references sent_message(messageid),
  foreign key (senderid) references person_identifier(personidentifierid),
  foreign key (recipientid) references person_identifier(personidentifierid),
  foreign key (conversationid) references conversation(conversationid)
);


drop table if exists app_user;
create table app_user(
	userid serial primary key,
	companyid integer,
	foreign key (companyid) references company_name (companyid),
	username varchar(200),
	pwhash text,
	pwstatus boolean default true,
	loginattempts smallint default 0,
	lastattempt timestamp,
	createts timestamp,
	updatets timestamp,
	endts timestamp
);

create table public.app_role
(
	approleid serial primary key,
	approlename varchar(20)
);
insert into public.app_role (approlename)
	values ('SystemAdmin');
insert into public.app_role (approlename)
	values ('CompanyAdmin');
create table public.app_user_role
(
	appuserroleid serial primary key,
	approleid integer,
	foreign key (approleid) references app_role (approleid),
	userid integer,
	foreign key (userid) references app_user (userid)
);

alter table public.company_identifier
 add column companyid integer;
alter table public.company_identifier
 add constraint fk_company_identifier_companyid foreign key (companyid) references company_name (companyid);

create table public.person_information
(
	personid serial primary key,
	personcode varchar(25) unique,
	companyid integer,
	firstname varchar(150),
	lastname varchar(250),
	gender varchar(10),
	email varchar(200),
	birthday date,
	foreign key (companyid) references company_name(companyid)
);

grant pg_read_server_files to siadmin;


 create or replace view public.vw_company_list as
 select companyid, companycode, companyname,
 companyname || ' (' || coalesce(companycode, 'no code given') || ')' as compoundname
 from company_name
 where companyname is not null;

drop view if exists public.vw_company_integrations_list;
create or replace view public.vw_company_integrations_list as
select companyidentifierid, ci.systemtypeid, systemname, systemdomain , st.systemtypedesc, ci.companyid,
  systemname || ' (' || coalesce(st.systemtypedesc, 'Unknown type') || ': ' || coalesce(systemdomain, 'no other information)')
  || ')' as compoundname
from company_identifier ci
join system_type st on ci.systemtypeid = st.systemtypeid;

create or replace function public.is_outside_work_hours(ts timestamp) returns boolean as $$
declare tsdecimaltime numeric = extract(hour from ts) + (extract(min from ts) / 60.000);
declare tsdow numeric = extract(dow from ts);
declare returnval boolean;
begin
returnval = case when tsdow in (0,6) or (tsdecimaltime < 8.5 or tsdecimaltime > 17.5) then true else false end;
return returnval;
end;
$$ language plpgsql;

--SCHEMA: graph


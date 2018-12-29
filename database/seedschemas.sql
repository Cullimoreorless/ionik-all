
create schema if not exists stg;

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


--SCHEMA: public

drop table if exists system_type;
create table system_type
(
	systemtypeid serial primary key,
	systemtypedesc varchar(100)
);

insert into system_type (systemtypedesc) values ('Slack');
insert into system_type (systemtypedesc) values ('Outlook Mail');

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


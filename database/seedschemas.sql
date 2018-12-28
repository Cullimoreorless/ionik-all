
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
create schema if not exists edw;


create table edw.dim_date (
	datekey serial primary key,
	fulldate date,
	dayofmonth smallint,
	dayofyear int,
	weekofyear	int,
	monthofyear int,
	year int,
	quarter smallint,
	dayofweek smallint,
	monthname varchar(20),
	weekday varchar(20)
);

copy edw.dim_date
from '/Users/hoseratheart/Downloads/DimDate.csv' delimiter ',' csv header;
--
--select * from edw.dim_date
--order by datekey desc


create table edw.dim_message(
	messagekey bigint,
	messagecode text,
	messagebody text,
	createts timestamp,
	updatets timestamp,
	endts timestamp
);

drop table edw.dim_company;
create table edw.dim_company(
	companykey serial primary key,
	companycode varchar(255),
	companyname text,
	createts timestamp,
	updatets timestamp,
	endts timestamp
);


create table edw.dim_location(
	locationkey serial primary key,
	companykey int,
	locationcode varchar(255),
	locationname text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey)
);

create table edw.dim_department(
	departmentkey serial primary key,
	companykey int,
	departmentcode varchar(255), 
	departmentname text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey)
);

create table edw.dim_cost_center(
	costcenterkey serial primary key,
	companykey int,
	costcentercode varchar(255),
	costcentername text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey)
);

create table edw.dim_project_team(
	projectteamkey serial primary key,
	companykey int ,
	projectteamcode varchar(255),
	projectteamname text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey)
);

create table edw.dim_identifier_type(
	identifiertypekey serial primary key,
	identifiertype varchar(250)
);

create table edw.dim_person(
	personkey serial primary key,
	companykey int, 
	displayname text,
	firstname varchar(255),
	lastname varchar(255),
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey)
);


create table edw.dim_person_identifier(
	personidentifierkey serial primary key,
	personkey int,
	identifiertypekey int,
	identifiercode varchar(255),
	identifierdescription text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (personkey) references edw.dim_person(personkey),
	foreign key (identifiertypekey) references edw.dim_identifier_type(identifiertypekey)
);

create table edw.dim_company_identifier(
	companyidentifierkey serial,
	companykey int,
	identifiertypekey int, 
	identifiercode varchar(255),
	identifierdescription text,
	createts timestamp,
	updatets timestamp,
	endts timestamp,
	foreign key (companykey) references edw.dim_company(companykey),
	foreign key (identifiertypekey) references edw.dim_identifier_type(identifiertypekey)
);


create table edw.fact_message_info(
	messageinfokey bigserial primary key,
	senderkey int,
	recipientkey int,
	companykey int,
	locationkey int,
	departmentkey int,
	costcenterkey int,
	projectteamkey int,
	datekey int,
	amount decimal(8,2),
	afterhoursamount decimal(8,2),
	sendermanagesrecipient boolean,
	recipientmanagessender boolean,
	foreign key (senderkey) references edw.dim_person(personkey),
	foreign key (recipientkey) references edw.dim_person(personkey),
	foreign key (companykey) references edw.dim_company(companykey),
	foreign key (locationkey) references edw.dim_location(locationkey),
	foreign key (departmentkey) references edw.dim_department(departmentkey),
	foreign key (costcenterkey) references edw.dim_cost_center(costcenterkey),
	foreign key (projectteamkey) references edw.dim_project_team(projectteamkey),
	foreign key (datekey) references edw.dim_date(datekey)
);

insert into edw.dim_identifier_type (identifiertype)
select systemtypedesc
from system_type 
where systemtypedesc not in (select identifiertype
from edw.dim_identifier_type);

insert into edw.dim_company (companycode, companyname, createts) 
select distinct companycode, companyname, now()
from company_name cn
where not exists (select 1 from edw.dim_company dc
where dc.companycode = cn.companycode);


update edw.dim_company
set companyname = base.companyname,
  updatets = now()
from (select distinct companycode, companyname 
from company_name) base
where base.companycode = dim_company.companycode
	and base.companyname <> dim_company.companyname;

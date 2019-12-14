const express = require('express');
const router = express.Router();

const db = require('./../db/db.service');


const groupingAttributes = {
    person: {
        sourceId: 'senderid',
        sourceText:`senderfirstname || ' ' || senderlastname`,
        targetId: 'recipientid',
        targetText:`recipientfirstname || ' ' || recipientlastname`,
        chosenId: 'personid',
        chosenText: `firstname || ' ' || lastname`
    },
    location: {
        sourceId: 'senderlocationcode',
        sourceText: 'senderlocationname',
        targetId: 'recipientlocationcode',
        targetText: 'recipientlocationname',
        chosenId: 'locationcode',
        chosenText: 'locationname',
    },
    group: (groupName) => {
        return {
            sourceId: `coalesce(sendergroups#>>'{"${groupName}","groupcode"}','None')`,
            sourceText: `coalesce(sendergroups#>>'{"${groupName}","groupname"}','None')`,
            targetId: `coalesce(recipientgroups#>>'{"${groupName}","groupcode"}','None')`,
            targetText: `coalesce(recipientgroups#>>'{"${groupName}","groupname"}','None')`,
            chosenId: `coalesce(groups#>>'{"${groupName}","groupcode"}','None')`,
            chosenText: `coalesce(groups#>>'{"${groupName}","groupname"}','None')`
        }
    }
};


const getGroupingObject = (groupingKey, groupName) =>
{
    return groupingKey === 'group' && groupName ? groupingAttributes['group'](groupName) : groupingAttributes[groupingKey];
};

const getLineQuery = (seriesKey, groupName) => {
    if(!['location','person','group'].includes(seriesKey) || (seriesKey === 'group' && !groupName) ) {
        return null;
    }

    const seriesObj = getGroupingObject(seriesKey, groupName);
    if(seriesObj)
    {
        return `
        select ${seriesObj.sourceId} as seriesid, 
            ${seriesObj.sourceText} as seriesname, 
            sum(weightedmessage) as y, 
            messagedate as x 
        from public.vw_all_message_info
        where companyid = :companyId and messagedate between :startDate and :endDate
        group by ${seriesObj.sourceId}, ${seriesObj.sourceText}, messagedate
        order by messagedate`;
    }
    else
    {
        return null;
    }
};

const getBaseNetworkQuery = (groupingKey, groupName, colorKey) => {
    if(!['location','person','group'].includes(groupingKey) || (groupingKey === 'group' && !groupName) ) {
        return null;
    }

    const groupObj = groupingKey === 'group' && groupName ? groupingAttributes['group'](groupName) : groupingAttributes[groupingKey];
    const colorObj = colorKey ? (['person','location'].includes(colorKey) ? groupingAttributes[colorKey] : groupingAttributes['group'](colorKey) ): groupObj;
    return `select
    ${groupObj.sourceId} as sourceid,
    ${groupObj.sourceText} as sourcetext,
    ${groupObj.targetId} as targetid,
    ${groupObj.targetText} as targettext,
    ${colorObj.sourceId} as sourcecolorid,
    ${colorObj.sourceText} as sourcecolortext,
    ${colorObj.targetId} as targetcolorid,
    ${colorObj.targetText} as targetcolortext,
    sum(weightedmessage) as weightedmessages
    from public.vw_all_message_info
    where companyid = :companyId
    group by
    ${groupObj.sourceId},
    ${groupObj.sourceText},
    ${groupObj.targetId},
    ${groupObj.targetText} ${colorKey ? ', ' + [colorObj.sourceId, colorObj.sourceText, colorObj.targetId, colorObj.targetText].join(', ') : ''}`
};

const getStackedBarQuery = (groupKey, groupName) => {
    let groupingObj = getGroupingObject(groupKey, groupName);
    return `select ROUND(100 * (sum(weightedmessage) over (partition by barid, category)/
                sum(weightedmessage) over (partition by barid)) 
        ) as y, bartext as x, category from (
    select ${groupingObj.sourceId} as barid, 
      ${groupingObj.sourceText} as bartext,
      case when sentoutofworkhours then 'After Hours' else 'During Business Hours' end as category,
      sum(weightedmessage) as weightedmessage
    from public.vw_all_message_info
    where companyId = :companyId and messagedate between :startDate and :endDate 
    group by ${groupingObj.sourceId}, ${groupingObj.sourceText}, sentoutofworkhours
    ) base`
};

const getSenderQuery = (groupKey, groupName) => {
    let groupingObj = getGroupingObject(groupKey, groupName);
    return `select array_agg(targettext) as labels, array_agg(targetamount) as data
            from (select ${groupingObj.targetId} as targetid, ${groupingObj.targetText} as targettext,
                sum(weightedmessage) as targetamount
            from public.vw_all_message_info
            where companyId = :companyId and messagedate between :startDate and :endDate
                and senderid = :senderId
            group by ${groupingObj.targetId}, ${groupingObj.targetText}) base`;
};
const getRecipientQuery = (groupKey, groupName) => {
    let groupingObj = getGroupingObject(groupKey, groupName);
    return `select array_agg(targettext) as labels, array_agg(targetamount) as data
            from (select ${groupingObj.sourceId} as targetid, ${groupingObj.sourceText} as targettext,
                sum(weightedmessage) as targetamount
            from public.vw_all_message_info
            where companyId = :companyId and messagedate between :startDate and :endDate
                and recipientid = :recipientId
            group by ${groupingObj.sourceId}, ${groupingObj.sourceText}) base`;
};


const graphQuery = (baseQuery) => `with messagedata as (
select *, 
  sum(weightedmessages) over (partition by sourceid) as sendertotalmessages,
  ntile(4) over (order by weightedmessages) as linkweight
  from ( ${baseQuery}
  )base )
select (
select json_agg(row_to_json(nodes)) as nodes from (
select nodeid, nodetext, nodecolor, max(nodeweight) as nodeweight
from (
select 
  sourceid as nodeid, 
  sourcetext as nodetext,
  sourcecolorid as nodecolor,
  ntile(5) over (order by sendertotalmessages) as nodeweight
from messagedata
union 
select 
  targetid as nodeid, 
  targettext as nodetext,
  targetcolorid as nodecolor,
  0::int as nodeweight
from messagedata) basenodes
 group by nodeid, nodetext, nodecolor) nodes) as nodes,
(select json_agg(row_to_json(links))
from (
select distinct sourceid, targetid, linkweight from messagedata 
) links) as links`;

router.post('/getMessageData', async(req, res) => {
   try{
       let baseQuery = getBaseNetworkQuery(req.body.groupingKey, req.body.groupName, req.body.colorKey);
       let results = await db.executeQuery(graphQuery(baseQuery), {companyId: req.companyId,
                                                                        startDate: req.body.startDate, endDate: req.body.endDate});
       res.send(results && results[0]);
   }
   catch(e)
   {
       console.error('getMessageData - ', e)
       res.status(500).send({message:'failed to query'})
   }
});

router.post('/getMessageSenderLineData', async(req, res) => {
    try {
        let results = await db.executeQuery(getLineQuery(req.body.seriesKey, req.body.groupName),
            {companyId:req.companyId, startDate:req.body.startDate, endDate:req.body.endDate});

        res.send(results);
    }
    catch(e)
    {
        console.error('getMessageSenderLineData - ', e);
        res.status(500).send({message:'failed to query'})
    }
});

router.post('/getAfterHoursBarData', async(req,res) => {
    try
    {
        let results = await db.executeQuery(getStackedBarQuery(req.body.groupingKey, req.body.groupName),
            {companyId:req.companyId, startDate:req.body.startDate, endDate:req.body.endDate});
        res.send(results);
    }
    catch(e)
    {
        console.error('getAfterHoursBarData - ', e);
        res.status(500).send({message:'failed to query'})
    }
});

router.post('/getSenderData', async (req,res) => {
    try {
        console.log('senderReq', req.body)
        results =  await db.executeQuery(getSenderQuery(req.body.groupingKey, req.body.groupName),
            {companyId: req.companyId, startDate:req.body.startDate, endDate: req.body.endDate, senderId: req.body.senderId});
        res.send(results);

    }
    catch (e) {
        console.error(`getSenderData - ${e}`);
        res.status(500).send({message:'failed to query'});
    }
});

router.post('/getSenderHoursData', async (req, res) => {
    try {
        results = await db.executeQuery(`select case when sentoutofworkhours then 'After Hours' else 'During Business Hours' end as seriesname, 
                  sum(weightedmessage) as y,
                  messagedate as x
                from public.vw_all_message_info
                where companyid = :companyId and messagedate between :startDate and :endDate and senderid = :senderId
                group by sentoutofworkhours, messagedate`,
            {companyId:req.companyId, startDate:req.body.startDate, endDate: req.body.endDate, senderId: req.body.senderId})
        res.send(results);
    }
    catch(e) {
        console.error('senderHourData - ' + e);
        res.status(500).send({message:'failed to query'});
    }
});


router.post('/getRecipientData', async (req,res) => {
    try {
        results = await db.executeQuery(getRecipientQuery(req.body.groupingKey, req.body.groupName),
            {companyId: req.companyId, startDate:req.body.startDate, endDate: req.body.endDate, recipientId: req.body.recipientId})
        res.send(results)

    }
    catch (e) {
        console.error(`getRecipientData - ${e}`);
        res.status(500).send({message:'failed to query'});
    }
});

const getResponseTimes = (groupingObj) => {
    return `select ${groupingObj.chosenId} as id, ${groupingObj.chosenText} as text, 
            avg(average_response_time) average_response_time, avg(average_wait_time) average_wait_time
        from (
        select pi.*, average_response_time, average_wait_time from 
        (select coalesce(resp.companyid, waits.companyid) as companyid, 
          coalesce(resp.personid, waits.personid) as personid, 
          average_response_time, average_wait_time
        from (
        select companyid, personid, avg(least(time_since_last_message, 60)) average_response_time
        from public.vw_response_times
        where prevperson <> personid and companyid = :companyId
          and messagetslocal::date between :startDate and :endDate
        group by companyid, personid) resp
        full join 
        (select companyid, personid, avg(least(time_til_response, 60)) average_wait_time
        from public.vw_response_times
        where nextperson <> personid and companyid = :companyId
          and messagetslocal::date between :startDate and :endDate
        group by companyid, personid) waits
         on resp.companyid = waits.companyid 
           and resp.personid = waits.personid) resp_time
         join 
        (select pi.personid, pi.companyid, pi.firstname, pi.lastname, 
          pi.gender, pi.ethnicity, pi.birthday, 
          pl.locationcode, pl.locationname, 
          (('{'::text || string_agg((('"'::text || grouptype::text) || '":'::text) || jsonb_build_object('groupcode', groupcode, 'groupname', groupname)::text, ','::text)) || '}'::text)::jsonb as groups
        from person_information pi 
        left join person_location pl 
          on pl.personid = pi.personid 
            and pl.companyid = pi.companyid
            and pi.companyid = :companyId
            and :endDate between pl.startdate and coalesce(pl.enddate, '3000-01-01')
        left join person_group pg 
          on pg.personid = pi.personid
            and pg.companyid = pi.companyid
            and pi.companyid = :companyId
            and :endDate between pg.startdate and coalesce(pg.enddate, '3000-01-01')
        group by pi.personid, pi.companyid, pi.firstname, pi.lastname, 
          pi.gender, pi.ethnicity, pi.birthday, 
          pl.locationcode, pl.locationname) as pi
          on pi.personid = resp_time.personid and pi.companyid = resp_time.companyid ) base group by ${groupingObj.chosenId}, ${groupingObj.chosenText}`;
};

router.post('/getResponseTimes', async (req, res) => {
    try{
        let groupingObj = getGroupingObject(req.body.groupingKey, req.body.groupName);
        let results = await db.executeQuery(getResponseTimes(groupingObj),
            {companyId:req.companyId, startDate:req.body.startDate, endDate:req.body.endDate});
        res.send(results);
    }
    catch(e){
        console.error(`getResponseTime - ${e}`);
        res.status(500).send({message:'failed to query'})
    }
});

const getTopThreesQuery = (groupingObject) => {
    return `select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(  src || ' ('||metric||'%)') as metricarray
        from (
        select 'Most Active After-Hours ' as MetricLabel, companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText} as src, 
          100 * round(sum(case when sentoutofworkhours then weightedmessage else 0 end) 
          / sum(weightedmessage),2) as metric
        from vw_all_message_info  
        where companyid = :companyId and messagedate between :startDate and :endDate
        group by companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText}
        order by 100 * round(sum(case when sentoutofworkhours then weightedmessage else 0 end) 
          / sum(weightedmessage),2) desc) base
        group by metriclabel) base2
        union 
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src || ' (score: '||metric||')') as metricarray
        from (
        select 'Most Active Overall' as MetricLabel, companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText} as src, 
          round(sum(weightedmessage),2) as metric
        from vw_all_message_info    
        where companyid = :companyId and messagedate between :startDate and :endDate
        group by companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText}
        order by sum(weightedmessage) desc) base
        group by metriclabel) base2
        union
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src || ' (score: '||metric||')') as metricarray
        from (
        select 'Least Active Overall' as MetricLabel, companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText} as src, 
          round(sum(weightedmessage),2) as metric
        from vw_all_message_info    
        where companyid = :companyId and messagedate between :startDate and :endDate
        group by companyid, ${groupingObject.sourceId}, ${groupingObject.sourceText}
        order by sum(weightedmessage) asc) base
        group by metriclabel) base2
        union
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src || ' (avg '||metric||' min)') as metricarray
        from (
        select 'Quickest Response Time' as metriclabel, companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText} as src, 
          round(avg(average_response_time),2) as metric
        from public.get_response_time_overall(:companyId, :startDate::date,:endDate::date)
        group by companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText}
        order by avg(average_response_time) asc) base
        group by metriclabel) base2
        union
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src || ' (avg '||metric||' min)') as metricarray
        from (
        select 'Longest Response Time' as metriclabel, companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText} as src, 
          round(avg(average_response_time),2) as metric
        from public.get_response_time_overall(:companyId, :startDate::date,:endDate::date)
        group by companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText}
        order by avg(average_response_time) desc) base
        group by metriclabel) base2
        union
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src|| ' (avg '||metric||' min)') as metricarray
        from (
        select 'Shortest Wait for Response' as metriclabel, companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText} as src, 
          round(avg(average_wait_time),2) as metric
        from public.get_response_time_overall(:companyId, :startDate::date,:endDate::date)
        group by companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText}
        order by avg(average_response_time) asc) base
        group by metriclabel) base2
        union
        select metriclabel, metricarray[1:3] from (
        select metriclabel, array_agg(src || ' (avg '||metric||' min)') as metricarray
        from (
        select 'Longest Wait for Response' as metriclabel, companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText} as src, 
          round(avg(average_wait_time),2) as metric
        from public.get_response_time_overall(:companyId, :startDate::date,:endDate::date)
        group by companyid, ${groupingObject.chosenId}, ${groupingObject.chosenText}
        order by avg(average_response_time) desc) base
        group by metriclabel) base2`;

};

router.post('/getCompanyTopThrees', async(req, res) => {
    try{
        let groupingObj = getGroupingObject(req.body.groupingKey, req.body.groupName);
        let results = await db.executeQuery(getTopThreesQuery(groupingObj),
            {companyId:req.companyId, startDate:req.body.startDate, endDate:req.body.endDate});
        res.send(results);
    }
    catch(e){
        console.error(`getResponseTime - ${e}`);
        res.status(500).send({message:'failed to query'})
    }

});

module.exports = router;

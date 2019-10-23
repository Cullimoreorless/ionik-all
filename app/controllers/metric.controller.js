const express = require('express');
const router = express.Router();

const db = require('./../db/db.service');


const groupingAttributes = {
    person: {
        sourceId: 'senderid',
        sourceText:`senderfirstname || ' ' || senderlastname`,
        targetId: 'recipientid',
        targetText:`recipientfirstname || ' ' || recipientlastname`,
    },
    location: {
        sourceId: 'senderlocationcode',
        sourceText: 'senderlocationname',
        targetId: 'recipientlocationcode',
        targetText: 'recipientlocationname',
    },
    group: (groupName) => {
        return {
            sourceId: `coalesce(sendergroups#>>'{"${groupName}","groupcode"}','None')`,
            sourceText: `coalesce(sendergroups#>>'{"${groupName}","groupname"}','None')`,
            targetId: `coalesce(recipientgroups#>>'{"${groupName}","groupcode"}','None')`,
            targetText: `coalesce(recipientgroups#>>'{"${groupName}","groupname"}','None')`
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
       res.send(results[0]);
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
        console.error('getMessageSenderLineData - ', e)
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

module.exports = router;

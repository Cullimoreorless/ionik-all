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

const getBaseQuery = (groupingKey, groupName, colorKey) => {
    console.log(groupingKey, colorKey)
    if(!['location','person','group'].includes(groupingKey) || (groupingKey === 'group' && !groupName) ) {
        return null;
    }

    const groupObj = groupingKey == 'group' && groupName ? groupingAttributes['group'](groupName) : groupingAttributes[groupingKey];
    const colorObj = colorKey ? (['person','location'].includes(colorKey) ? groupingAttributes[colorKey] : groupingAttributes['group'](colorKey) ): groupObj;
    console.log(groupObj, colorObj);
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

// select
// senderid as sourceid,
// senderfirstname || ' ' || senderlastname as sourcetext,
// recipientid as targetid,
// recipientfirstname || ' ' || recipientlastname as targettext,
// senderlocationcode as sourcecolorid,
// recipientlocationcode as targetcolorid,
//     sendergroups#>>'{"Project XXXTeam","groupname"}',
//     recipientgroups#>>'{"Project Team","groupname"}',
// sum(weightedmessage) as weightedmessages
// from public.vw_all_message_info
// where companyid = :companyId
// and messagedate >= :startDate and messagedate <= :endDate
// group by
// senderid,
// senderfirstname || ' ' || senderlastname,
//     recipientid ,
// recipientfirstname || ' ' || recipientlastname ,
//     senderlocationcode,
//     recipientlocationcode,
//     recipientgroups#>>'{"Project Team","groupname"}',
//     sendergroups#>>'{"Project XXXTeam","groupname"}'

const graphQuery = (baseQuery) => `with messagedata as (
select *, 
  sum(weightedmessages) over (partition by sourceid) as sendertotalmessages,
  ntile(4) over (order by weightedmessages) as linkweight
  from ( ${baseQuery}
  )base )
select (
select json_agg(row_to_json(nodes)) as nodes from (
select 
  sourceid as nodeid, 
  sourcetext as nodetext,
  sourcecolorid as nodecolor
from messagedata
union 
select 
  targetid as nodeid, 
  targettext as nodetext,
  targetcolorid as nodecolor
from messagedata) nodes) as nodes,
(select json_agg(row_to_json(links))
from (
select distinct sourceid, targetid, linkweight from messagedata 
) links) as links`;

router.post('/getMessageData', async(req, res) => {
   try{
       console.log(req.body);
       let baseQuery = getBaseQuery(req.body.groupingKey, req.body.groupName, req.body.colorKey);
       console.log(baseQuery);
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

module.exports = router;

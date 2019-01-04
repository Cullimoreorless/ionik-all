USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM "file:/Users/hoseratheart/ionik/database/graph/people.csv" as row
CREATE (:Person {personId:row.personidentifierid, personName:row.systemrealname, timezone:row.systemtimezonename, isActive:row.isactive});

schema await;

CREATE INDEX ON :Person(personId);

USING PERIODIC COMMIT
LOAD CSV WITH HEADERS FROM "file:/Users/hoseratheart/ionik/database/graph/messages.csv" as row
MATCH (sender:Person {personId:row.senderid})
MATCH (recipient:Person {personId:row.recipientid})
MERGE (sender)-(msg:MESSAGES)->(recipient)
ON CREATE SET msg.numberOfInteractions = toFloat(row.numberofinteractions);
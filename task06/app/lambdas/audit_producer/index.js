const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const AUDIT_TABLE_NAME = 'cmtr-63edc6d2-Audit-test' || "Audit"; 

exports.handler = async (event) => {
    try {
        console.log('Stream Event:', JSON.stringify(event, null, 2));

        
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY' || record.eventName === 'REMOVE') {
             
                const auditEntry = createAuditEntry(record);

              
                await dynamoDB.put({
                    TableName: AUDIT_TABLE_NAME,
                    Item: auditEntry,
                }).promise();

                console.log('Audit entry stored:', auditEntry);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Stream processed successfully' }),
        };
    } catch (error) {
        console.error('Error processing stream:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};


function createAuditEntry(record) {
    const timestamp = new Date().toISOString();
    let auditEntry = {
        id: `${record.eventID}-${timestamp}`, 
        timestamp: timestamp,
        eventType: record.eventName,
    };

    if (record.dynamodb) {
        if (record.dynamodb.NewImage) {
            auditEntry.newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        }
        if (record.dynamodb.OldImage) {
            auditEntry.oldImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
        }
    }

    return auditEntry;
}

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const tableName = 'cmtr-712a8896-Audit-test';

    for (const item of event.Records) {
        if (!item) continue;

        const eventName = item.eventName;
        const newImage = AWS.DynamoDB.Converter.unmarshall(item.dynamodb.NewImage);
        const oldImage = item.dynamodb.OldImage ? AWS.DynamoDB.Converter.unmarshall(item.dynamodb.OldImage) : null;

        if (eventName === 'INSERT') {
            const itemKey = newImage.key || '';
            const itemValue = newImage.value || '';
            console.log('Item Key:', itemKey);
            console.log('Item Value:', itemValue);

            const item = {
                id: uuidv4(),
                itemKey: itemKey,
                modificationTime: new Date().toISOString(),
                newValue: {
                    key: itemKey,
                    value: itemValue
                }
            };

            await dynamodb.put({
                TableName: tableName,
                Item: item
            }).promise();
        } else if (eventName === 'MODIFY') {
            const itemKey = newImage.key || '';
            const newValue = newImage.value || '';
            const oldValue = oldImage ? oldImage.value || '' : '';

            const item = {
                id: uuidv4(),
                itemKey: itemKey,
                modificationTime: new Date().toISOString(),
                updatedAttribute: 'value',
                oldValue: oldValue,
                newValue: newValue
            };

            await dynamodb.put({
                TableName: tableName,
                Item: item
            }).promise();
        }

        console.log('Processed record:', JSON.stringify(item));
    }

    return null;
};
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.table_name;

const getParams = (key, newValue, oldValue = undefined) => {
  const createdAt = new Date();
  return {
    TableName: tableName,
    Item: {
      id: uuidv4(),
      modificationTime: createdAt.toISOString(),
      key,
      updatedAttribute: "value",
      ...(oldValue && { oldValue }),
      newValue,
    },
  };
};

exports.handler = async (event) => {

  const eventRecord = event.Records[0];
  if (!["MODIFY", "INSERT"].includes(eventRecord.eventName)) return;

  const newItem = eventRecord.dynamodb.NewImage;
  const newValue = parseInt(newItem.value.N);
  const key = newItem.key.S;

  let params = {};
  if (eventRecord.eventName === "MODIFY") {
    const oldItem = eventRecord.dynamodb.OldImage;
    const oldValue = parseInt(oldItem.value.N);
    params = getParams(key, newValue, oldValue);
  } else {
    params = getParams(key, {
      key: key,
      value: newValue,
    });
  }

  try {
    await docClient.put(params).promise();
    return true;
  } catch (err) {
    const parsedError = JSON.stringify(err, null, 2);
    console.error(parsedError);
    return parsedError;
  }
};
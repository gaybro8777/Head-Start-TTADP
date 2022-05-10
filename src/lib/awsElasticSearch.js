import { auditLogger, logger } from '../logger';

const { Client, Connection } = require('@opensearch-project/opensearch');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const aws4 = require('aws4');

const host = 'http://localhost:9200'; // e.g. https://my-domain.region.es.amazonaws.com

const createAwsConnector = (credentials, region) => {
  class AmazonConnection extends Connection {
    buildRequestObject(params) {
      const request = super.buildRequestObject(params);
      request.service = 'es';
      request.region = region;
      request.headers = request.headers || {};
      request.headers.host = request.hostname;

      return aws4.sign(request, credentials);
    }
  }
  return {
    Connection: AmazonConnection,
  };
};

const getClient = async () => {
  const credentials = await defaultProvider()();
  return new Client({
    ...createAwsConnector(credentials, 'us-east-1'),
    node: host,
  });
};
/*
  Create an index that can have searchable documents assigned.
*/
const createIndex = async (indexName) => {
  try {
    // Initialize the client.
    const client = await getClient();

    // Create index.
    await client.indices.create({
      index: indexName,
    });

    logger.info(`AWS OpenSearch: Successfully created index ${indexName}`);
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to create index '${indexName}': ${error.message}`);
    throw error;
  }
};
/*
  Assign a searchable document to an index.
*/
const addIndexDocument = async (indexName, id, document) => {
  try {
    // Initialize the client.
    const client = await getClient();

    // Add a document to an index.
    await client.index({
      index: indexName,
      id,
      body: document,
      refresh: true, // triggers manual refresh.
    });
    logger.info(`AWS OpenSearch: Successfully added document to index ${indexName}`);
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to add document to index '${indexName}': ${error.message}`);
    throw error;
  }
};
/*
  Search index documents.
*/
const search = async (indexName, fields, query) => {
  try {
    // Initialize the client.
    const client = await getClient();

    // Create search body.
    const body = {
      //size: 20,
      query: {
        multi_match: {
          query,
          fields,
        },
      },
    };

    // Search an index.
    const res = await client.search({
      index: indexName,
      body,
    });
    logger.info(`AWS OpenSearch: Successfully searched the index ${indexName} using query '${query}`);

    return res.body.hits;
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to search the index '${indexName}' with query '${query}': ${error.message}`);
    throw error;
  }
};

/*
  Update index document.
*/
const updateIndexDocument = async (indexName, id, body) => {
  try {
    // Initialize the client.
    const client = await getClient();

    // Update index document.
    await client.update({
      index: indexName,
      id,
      body,
      refresh: true, // triggers manual refresh.
    });

    logger.info(`AWS OpenSearch: Successfully updated document  index ${indexName} for id ${id}`);
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to update the index '${indexName} for id ${id}': ${error.message}`);
    throw error;
  }
};

/*
  Delete an index document.
*/
const deleteIndexDocument = async (indexName, id) => {
  try {
    // Initialize the client.
    const client = await getClient();

    // Delete index document.
    await client.delete({
      index: indexName,
      id,
      refresh: true, // triggers manual refresh.
    });

    logger.info(`AWS OpenSearch: Successfully deleted document '${id}' for index '${indexName}'`);
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to delete document '${id}' for index '${indexName}': ${error.message}`);
    throw error;
  }
};

/*
  Delete an index.
*/
const deleteIndex = async (indexName) => {
  try {
    // Initialize the client.
    const client = await getClient();

    await client.indices.delete({
      index: indexName,
    });
    logger.info(`AWS OpenSearch: Successfully deleted index '${indexName}'`);
  } catch (error) {
    auditLogger.error(`AWS OpenSearch Error: Unable to delete index '${indexName}': ${error.message}`);
    throw error;
  }
};

export {
  createIndex,
  addIndexDocument,
  updateIndexDocument,
  search,
  deleteIndexDocument,
  deleteIndex,
};

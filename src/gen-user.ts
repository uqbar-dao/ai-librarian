/* eslint-disable import/no-extraneous-dependencies */
import { getEnv, getQueryingCommandLineArguments } from "utils/util.ts";
import { embedder } from "embeddings.ts";
import { Pinecone } from "@pinecone-database/pinecone";
import type { ArticleRecord } from "types.ts";
import fs from 'fs';

const indexName = getEnv("PINECONE_INDEX");
const pinecone = new Pinecone();

// Ensure the index exists
try {
  const description = await pinecone.describeIndex(indexName);
  if (!description.status?.ready) {
    throw `Index not ready, description was ${JSON.stringify(description)}`
  }
} catch (e) {
  console.log('An error occurred. Run "npm run index" to load data into the index before querying.')
  throw e;
}

const index = pinecone.index<ArticleRecord>(indexName).namespace('default');

await embedder.init("Xenova/all-MiniLM-L6-v2");

const { query, section } = getQueryingCommandLineArguments();

// We create a simulated user with an interest given a query and a specific section
const queryEmbedding = await embedder.embed(query);
let filter = {};
if (section) {
    filter = { section: { "$eq": section } };
}
const queryResult = await index.query({
    vector: queryEmbedding.values,
    includeMetadata: true,
    includeValues: true,
    filter,
    topK: 10
});

const userPreferences = queryResult.matches!.map(article => article.metadata);

const csvData = userPreferences.map((record) => {
  if (record === undefined) return '';
  const { index, title, article, publication, url, author, section } = record;
  const date = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  return `${date},${year},${month},${day},"${author}","${title}","${article}","${url}","${section}","${publication}"`;
}).join('\n');

const header = "date,year,month,day,author,title,article,url,section,publication";
fs.writeFileSync(`users/${query}.csv`, `${header}\n${csvData}`, 'utf8');

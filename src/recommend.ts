/* eslint-disable import/no-extraneous-dependencies */
import { getEnv, getQueryingCommandLineArguments } from "utils/util.ts";
import { embedder } from "embeddings.ts";
import { Table } from 'console-table-printer';
import { Pinecone } from "@pinecone-database/pinecone";
import type { ArticleRecord } from "types.ts";
import fs from "fs";
import meanVector from "utils/mean.ts";

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

const { user, query, section } = getQueryingCommandLineArguments();

// We create a simulated user with an interest given a query and a specific section
const meanUserVec = JSON.parse(fs.readFileSync(`users/${user}.json`, "utf8")) as number[];
const queryEmbedding = await embedder.embed(query);
const combinedEmbedding = meanVector([meanUserVec, queryEmbedding.values]); // TODO might need to weight
// const combinedEmbedding = JSON.parse(fs.readFileSync(`users/${user}.json`, "utf8")) as number[];

const recommendations = await index.query({
    vector: combinedEmbedding,
    includeMetadata: true,
    includeValues: true,
    filter: section ?  { section: { "$eq": section } } : {},
    topK: 10
});

const userRecommendations = new Table({
  columns: [
    { name: "title", alignment: "left" },
    { name: "author", alignment: "left" },
    { name: "section", alignment: "left" },
  ]
});

recommendations?.matches?.slice(0, 10).forEach((result: any) => {
  const { title, article, publication, section } = result.metadata;
  userRecommendations.addRow({
    title,
    article: `${article.slice(0, 70)}...`,
    publication,
    section
  });
});
console.log("=========== Recommendations ==========");
userRecommendations.printTable();

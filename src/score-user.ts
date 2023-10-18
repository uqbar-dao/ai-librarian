import { getScoreCommandLineArguments } from "utils/util.ts";
import { embedder } from "embeddings.ts";
import * as dfd from "danfojs-node";
import { Document } from 'langchain/document';
import type { PineconeRecord } from "@pinecone-database/pinecone";
import type { ArticleRecord } from "types.ts";
import fs from "fs";
import loadCSVFile from "utils/csvLoader.ts";

await embedder.init("Xenova/all-MiniLM-L6-v2");

const { user } = getScoreCommandLineArguments();

// get the user's data
const userData = await loadCSVFile(`users/${user}.csv`);
const clean = userData.dropNa() as dfd.DataFrame;

const documents = dfd.toJSON(clean) as ArticleRecord[];
const toEmbed = documents.map(record => new Document({
    pageContent: record.article as string,
    metadata: {
      section: record.section,
      url: record.url,
      title: record.title,
      publication: record.publication,
      author: record.author,
      article: record.article
    }
  })
);

const mean = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
const meanVector = (vectors: number[][]): number[] => {
  const { length } = vectors[0];

  return Array.from({ length }).map((_, i) =>
    mean(vectors.map(vec => vec[i]))
  );
};

// embed the user's preferences and save them to a file
await embedder.embedBatch(toEmbed, 1000, (embeddings: PineconeRecord[]) => {
  const userVectors = embeddings.map((result: PineconeRecord) => result.values);
  const meanVec = meanVector(userVectors);
  fs.writeFileSync(`users/${user}.json`, JSON.stringify(meanVec));
});

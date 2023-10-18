import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
  arr.slice(i * chunkSize, (i + 1) * chunkSize)
);

const getUpsertCommandLineArguments = () => {
  const argv = yargs(hideBin(process.argv))
    .option("file", {
      alias: "f",
      type: "string",
      description: "The query to search for",
      demandOption: true,
    })

    .parseSync();

  const { file } = argv;
  if (!file) {
    console.error("Please provide a file");
    process.exit(1);
  }

  return { file };
};

const getQueryingCommandLineArguments = () => {
  const argv = yargs(hideBin(process.argv))
    .option("user", {
      alias: "u",
      type: "string",
      description: "The user to search for",
      demandOption: true,
    })
    .option("query", {
      alias: "q",
      type: "string",
      description: "The query to search for",
      demandOption: true,
    })
    .option("section", {
      alias: "s",
      type: "string",
      description: "The section of the article",
      demandOption: false,
    })

    .parseSync();

  const { user, query, section } = argv;
  if (!user) {
    console.error("Please provide a user");
    process.exit(1);
  }
  if (!query) {
    console.error("Please provide a query");
    process.exit(1);
  }

  return { user, query, section };
};

const getScoreCommandLineArguments = () => {
    const argv = yargs(hideBin(process.argv))
      .option("user", {
        alias: "q",
        type: "string",
        description: "The user to score",
        demandOption: true,
      })
  
      .parseSync();
  
    const { user } = argv;
    if (!user) {
      console.error("Please provide a user");
      process.exit(1);
    }
  
    return { user };
  };

export const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable not set`);
  }
  return value;
};

const validateEnvironmentVariables = () => {
  getEnv("PINECONE_API_KEY");
  getEnv("PINECONE_ENVIRONMENT");
  getEnv("PINECONE_INDEX");
};

export {
  getScoreCommandLineArguments,
  getUpsertCommandLineArguments,
  getQueryingCommandLineArguments,
  sliceIntoChunks,
  validateEnvironmentVariables
};

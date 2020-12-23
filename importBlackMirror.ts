import * as yargs from "yargs";
import chalk from "chalk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { createClient } from "contentful-management";
import { Environment, CreateEntryProps } from "contentful-management/types";
import { SetFieldValue } from "./entryPropUtils";

const argv = yargs
  .usage("Archive entries of a particular type: $0 [options]")
  .option("space-id", {
    describe: "space id of the target Space",
    type: "string",
    demand: false,
  })
  .option("environment-id", {
    describe: "environment id within the target Space",
    type: "string",
    demand: true,
  })
  .option("management-token", {
    describe:
      "management token for this space (can be stored in CONTENTFUL_MANAGEMENT_ACCESS_TOKEN environment variable on PC)",
    type: "string",
  }).argv;

async function ImportBlackMirror(env: Environment) {
  const blackMirrorWholeBuffer = fs.readFileSync("black_mirror.json");
  const json = JSON.parse(blackMirrorWholeBuffer.toString());
  const episodes = json["_embedded"]["episodes"];
  console.log(`#episodes = ${episodes.length}`);
  for (const episode of episodes) {
    let newEntry: CreateEntryProps = { fields: {} };
    const { name, season, number: num, airdate, summary } = episode;
    const entryTitle = `Black Mirror episode: ${name}`;
    SetFieldValue(newEntry, "entryTitle", entryTitle);
    SetFieldValue(newEntry, "name", name);
    SetFieldValue(newEntry, "number", num);
    SetFieldValue(newEntry, "season", season);
    SetFieldValue(newEntry, "airDate", airdate);
    SetFieldValue(newEntry, "summary", summary);
    try {
      console.log(`creating and publishing '${entryTitle}'`);
      const createdEntry = await env.createEntry("seriesEpisode", newEntry);
      await createdEntry.publish();
    } catch (err) {
      console.log(
        chalk.red(
          `unable to create episode '${entryTitle}', err=${err.message}`
        )
      );
      process.exit(1);
    }
  }
}

dotenv.config();
const spaceId = process.env["CONTENTFUL_SPACE"];
const mgtToken = process.env["CMA_TOKEN"];

const envId = argv["environment-id"];
const client = createClient({
  accessToken: mgtToken,
});

client
  .getSpace(spaceId)
  .then((space) => space.getEnvironment(envId))
  .then((env) => {
    ImportBlackMirror(env);
  })
  .catch(console.error);

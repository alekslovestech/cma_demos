import * as yargs from "yargs";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { createClient } from "contentful-management";

import { Environment, Entry } from "contentful-management/types";

const argv = yargs
  .usage("Archive entries of a particular type: $0 [options]")
  .options("environment-id", {
    describe: "environment id",
    type: "string",
    demand: true,
  })
  .options("type-id", {
    describe: "type id for entries we want to count",
    type: "string",
    demand: true,
  })
  .options("ageindays", {
    describe: "remove all entries older than this age",
    type: "number",
  }).argv;

async function IsAlive(env: Environment, entry: Entry): Promise<boolean> {
  //referenced by some other "alive" entries
  return true;
}

function AgeInDays(entry: Entry): number {
  return 0;
}

async function ArchiveDeadEntriesOfType(
  env: Environment,
  typeId: string,
  ageInDaysThreshold: number
): Promise<void> {}

dotenv.config();
const spaceId = process.env["CONTENTFUL_SPACE"];
const mgtToken = process.env["CMA_TOKEN"];

const envId = argv["environment-id"];
const ageInDaysThreshold = argv["ageindays"];
const typeId = argv["type-id"];
const client = createClient({
  accessToken: mgtToken,
});

client
  .getSpace(spaceId)
  .then((space) => space.getEnvironment(envId))
  .then((env) => {
    ArchiveDeadEntriesOfType(env, typeId, ageInDaysThreshold);
  })
  .catch(console.error);

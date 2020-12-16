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
  const entryId = entry.sys.id;
  const entriesReferencingMe = await env.getEntries({
    links_to_entry: entryId,
  });

  const numReferences = entriesReferencingMe.items.length;
  //referenced by noone
  if (numReferences === 0) return false;

  //referenced only by other archived entries
  if (entriesReferencingMe.items.every((m) => m.isArchived())) {
    const entryNoun = numReferences === 1 ? "entry" : "entries";
    console.log(
      chalk.cyanBright(
        `${entryId}: referenced by ${numReferences} Archived ${entryNoun}!!`
      )
    );
    return false;
  }

  //referenced by some other "alive" entries
  return true;
}

function AgeInDays(entry: Entry): number {
  const lastUpdated: string = entry.sys.updatedAt;
  const now = new Date().getTime();
  const lastUpdatedTime = new Date(lastUpdated).getTime();
  const entryAgeInSeconds = (now - lastUpdatedTime) / 1000.0;
  const entryAgeInDays = entryAgeInSeconds / (3600 * 24);
  return entryAgeInDays;
}

async function ArchiveDeadEntriesOfType(
  env: Environment,
  typeId: string,
  ageInDaysThreshold: number
): Promise<void> {
  console.log(`Archiving entries of type '${typeId}'`);
  const all_entries = await env.getEntries({
    content_type: typeId,
    limit: 1000,
  });
  for (const entry of all_entries.items) {
    const entryId = entry.sys.id;

    const isAlive = await IsAlive(env, entry);
    if (isAlive) continue;

    const ageInDays = AgeInDays(entry);
    console.log(`actual age = ${ageInDays}, threshold=${ageInDaysThreshold}`);
    const isOld = ageInDays >= ageInDaysThreshold;
    if (isOld) {
      console.log(
        `${entryId}: archiving old and dead entry (${ageInDays} days) `
      );
      let unpublishedEntry = entry;
      if (entry.isPublished()) {
        unpublishedEntry = await entry.unpublish();
      }
      if (!unpublishedEntry.isArchived()) {
        console.log(`archiving ${unpublishedEntry.sys.id}`);
        await unpublishedEntry.archive();
      }
    } else {
      console.log(
        chalk.yellow(
          `${entryId}: Keeping dead entry because it is only ${ageInDays} days old!`
        )
      );
    }
  }
}

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

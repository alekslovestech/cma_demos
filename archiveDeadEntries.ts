import * as yargs from "yargs";
import chalk from "chalk";
import * as dotenv from "dotenv";
import { createClient } from "contentful-management";

import {
  Environment,
  Entry,
  Collection,
  EntryProps,
} from "contentful-management/types";

const argv = yargs
  .usage("Archive entries of a particular type: $0 [options]")
  .options("type-id", {
    describe: "type id for entries we want to count",
    type: "string",
    demand: true,
  })
  .options("ageinweeks", {
    describe: "remove all entries older than this age",
    type: "number",
    default: 10,
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
    console.log(
      chalk.cyanBright(
        `${entryId}: referenced by ${numReferences} Archived entries!!`
      )
    );
    return false;
  }

  //referenced by some other "alive" entries
  return true;
}

function AgeInWeeks(entry: Entry): number {
  const lastUpdated: string = entry.sys.updatedAt;
  const now = new Date().getTime();
  const lastUpdatedTime = new Date(lastUpdated).getTime();
  const entryAgeInSeconds = (now - lastUpdatedTime) / 1000.0;
  const entryAgeInWeeks = Math.floor(entryAgeInSeconds / (3600 * 24 * 7));
  return entryAgeInWeeks;
}

async function ArchiveDeadEntriesOfType(
  env: Environment,
  typeId: string
): Promise<void> {
  console.log(`Deleting entries of type ${typeId}`);
  const all_entries: Collection<Entry, EntryProps> = await env.getEntries({
    content_type: this.typeId,
    limit: 1000,
  });
  for (const entry of all_entries.items) {
    const entryId = entry.sys.id;

    const isAlive = await IsAlive(env, entry);
    if (isAlive) continue;

    const ageInWeeks = AgeInWeeks(entry);
    const isOld = ageInWeeks >= ageInWeeksThreshold;
    if (isOld) {
      console.log(
        `${entryId}: archiving old and dead entry (${ageInWeeks} weeks) `
      );
      let unpublishedEntry = entry;
      if (entry.isPublished()) {
        unpublishedEntry = await entry.unpublish();
      }
      if (!unpublishedEntry.isArchived()) {
        await unpublishedEntry.archive();
      }
    }
    console.log(
      chalk.yellow(
        `${entryId}: Keeping dead entry because it is only ${ageInWeeks} weeks old!`
      )
    );
  }
}

dotenv.config();
const spaceId = process.env["CONTENTFUL_SPACE"];
const envId = process.env["CONTENTFUL_ENV"];
const mgtToken = process.env["CONTENTFUL_MANAGEMENT_ACCESS_TOKEN"];

const ageInWeeksThreshold = argv["ageinweeks"];
const typeId = argv["type-id"];
const client = createClient({
  accessToken: mgtToken,
});

console.log({ client });
client
  .getSpace(spaceId)
  .then((space) => space.getEnvironment(envId))
  .then((env) => {
    ArchiveDeadEntriesOfType(env, typeId);
  })
  .catch(console.error);

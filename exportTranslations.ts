import * as yargs from "yargs";
import * as dotenv from "dotenv";
import * as fs from "fs";
import chalk from "chalk";

import { createClient } from "contentful-management";
import { Entry, Environment } from "contentful-management/types";
import {
  GetFieldValue,
  GetReferenceIdArray,
  getTypeIdFromEntry,
} from "./entryPropUtils";
import { ContentTypeFieldCache } from "./contentTypeFieldCache";

const argv = yargs
  .usage("Export translations marked by Editors: $0 [options]")
  .option("space-id", {
    describe: "space id of the target Space",
    type: "string",
    demand: false,
  })
  .option("management-token", {
    describe:
      "management token for this space (can be stored in CONTENTFUL_MANAGEMENT_ACCESS_TOKEN environment variable on PC)",
    type: "string",
  })
  .option("environment-id", {
    describe: "environment id of the target Space",
    type: "string",
    demand: true,
  })
  .options("url", {
    describe: "url to start with",
    type: "string",
    demand: true,
  })
  .options("locale", {
    describe: "locale to export",
    type: "string",
    demand: true,
  }).argv;
interface IHash {
  [id: string]: Entry;
}

async function Traverse(
  env: Environment,
  entry: Entry,
  fieldCache: ContentTypeFieldCache,
  traversedEntries: IHash
) {
  const entryId = entry.sys.id;
  const entryTypeId = getTypeIdFromEntry(entry);
  const traversableFields = fieldCache.GetTraversableFields(entryTypeId);

  if (entryId in traversedEntries) {
    console.log(chalk.yellow(`${entryId} already traversed`));
    return;
  }
  traversedEntries[entryId] = entry;
  for (const field of traversableFields) {
    console.log(`found traversable field ${field.id}`);
    const refIds = GetReferenceIdArray(entry, field);
    for (const refId of refIds) {
      const refEntry = await env.getEntry(refId);
      await Traverse(env, refEntry, fieldCache, traversedEntries);
    }
  }
}

async function TraverseFromURL(
  env: Environment,
  url: string,
  fieldCache: ContentTypeFieldCache,
  traversedEntries: IHash
) {
  const course_entries = await env.getEntries({ content_type: "course" });
  const this_course_entry: Entry = course_entries.items.find(
    (e) => GetFieldValue(e, "slug") === url
  );
  if (!this_course_entry) {
    console.log(`No course with URL='${url}' found`);
    return;
  }
  await Traverse(env, this_course_entry, fieldCache, traversedEntries);
}

async function ExportTranslations(
  env: Environment,
  initial_url: string,
  locale: string
) {
  const fieldCache = new ContentTypeFieldCache(env);
  await fieldCache.Init();
  let traversedEntries: IHash = {};
  await TraverseFromURL(env, initial_url, fieldCache, traversedEntries);
  let serEntries = [];
  for (const id in traversedEntries) {
    const oneEntry = traversedEntries[id];
    const typeId = getTypeIdFromEntry(oneEntry);
    const localizableTextFields = fieldCache.GetLocalizableTextFields(typeId);
    let serEntry = { fields: {}, entryId: id, typeId: typeId };
    const localizableFieldIds = localizableTextFields.map((m) => m.id);
    console.log({ localizableFieldIds });
    for (const fieldId of localizableFieldIds) {
      const fieldValue = GetFieldValue(oneEntry, fieldId, locale);
      serEntry.fields[fieldId] = fieldValue;
    }
    serEntries.push(serEntry);
  }
  const fname = `exported_content_${locale}.json`;
  fs.writeFileSync(fname, JSON.stringify(serEntries, null, 2));
}

dotenv.config();
const spaceId = process.env["CONTENTFUL_SPACE"];
const mgtToken = process.env["CMA_TOKEN"];

const envId = argv["environment-id"];
const initial_url = argv["url"];
const locale = argv["locale"];
const client = createClient({
  accessToken: mgtToken,
});

client
  .getSpace(spaceId)
  .then((space) => space.getEnvironment(envId))
  .then((env: Environment) => {
    ExportTranslations(env, initial_url, locale);
  })
  .catch(console.error);

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import * as fs from "fs";

import { createClient } from "contentful-management";
import { Environment } from "contentful-management/types";
import { GetFieldValue, getTypeIdFromEntry } from "./entryPropUtils";
import { ContentTypeFieldCache } from "./contentTypeFieldCache";
import { TraversalService } from "./traversalService";

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

async function ExportTranslations(
  env: Environment,
  initial_url: string,
  locale: string
) {
  const fieldCache = new ContentTypeFieldCache(env);
  await fieldCache.Init();
  const traversalService = new TraversalService(env, fieldCache);
  await traversalService.TraverseFromURL(initial_url);
  let serEntries = [];
  for (const id in traversalService.traversedEntries) {
    const oneEntry = traversalService.traversedEntries[id];
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

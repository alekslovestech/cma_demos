import * as yargs from "yargs";
import * as dotenv from "dotenv";

import { Environment } from "contentful-management/types";
import { GetFieldValue, SetFieldValue } from "./entryPropUtils";
import { createClient } from "contentful-management";

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
  }).argv;

async function ExportTranslations(env: Environment) {
  /*const bigPlatform = new ImportExportFacade(env);
  await bigPlatform.Init();
  const traversalService = bigPlatform.GetNewTraversalService();

  console.log("traversing URLs ...");
  await traversalService.TraverseFromURL(urlPattern, exactUrl);

  let fng = new ExportFileNameGenerator(urlPattern, exportMode);
  const entrySerializerWithFiles = new EntrySerializerWithFiles(
    fng,
    bigPlatform,
    traversalService,
    exportMode,
    locale,
    markEntry
  );
  await entrySerializerWithFiles.SerializeToFile(locale); */
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
  .then((env: Environment) => {
    ExportTranslations(env);
  })
  .catch(console.error);

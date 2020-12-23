import * as yargs from "yargs";
import chalk from "chalk";
import * as dotenv from "dotenv";
import * as fetch from "node-fetch";
import { createClient } from "contentful-management";

import {
  Environment,
  Entry,
  CreateEntryProps,
} from "contentful-management/types";
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

async function ImportAstronauts(env: Environment) {
  const astrosResponse = await fetch("http://api.open-notify.org/astros.json");
  const astros = await astrosResponse.json();
  const people = astros.people;
  for (const person of people) {
    let newEntry: CreateEntryProps = { fields: {} };
    const craft = person["craft"];
    const name = person["name"];
    SetFieldValue(newEntry, "entryTitle", `${craft}: ${name}`);
    SetFieldValue(newEntry, "craft", craft);
    SetFieldValue(newEntry, "name", name);
    try {
      console.log(`creating and publishing craft=${craft} name=${name}`);
      const createdEntry = await env.createEntry("astronaut", newEntry);
      await createdEntry.publish();
    } catch (err) {
      console.log(`unable to create astronaut ${name}`);
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
    ImportAstronauts(env);
  })
  .catch(console.error);

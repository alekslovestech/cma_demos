import chalk from "chalk";
import { Entry, Environment } from "contentful-management/types";
import { ContentTypeFieldCache } from "./contentTypeFieldCache";
import {
  GetFieldValue,
  GetReferenceIdArray,
  getTypeIdFromEntry,
} from "./entryPropUtils";

export class TraversalService {
  public readonly traversedEntries: Entry[];
  constructor(
    private env: Environment,
    private fieldCache: ContentTypeFieldCache
  ) {
    this.traversedEntries = [];
  }

  async Traverse(entry: Entry) {
    const entryId = entry.sys.id;
    const entryTypeId = getTypeIdFromEntry(entry);
    const traversableFields = this.fieldCache.GetTraversableFields(entryTypeId);

    if (this.traversedEntries.includes(entry)) {
      console.log(chalk.yellow(`${entryId} already traversed`));
      return;
    }
    this.traversedEntries.push(entry);
    for (const field of traversableFields) {
      console.log(`${entryId}: traversing field '${field.id}'`);
      const refIds = GetReferenceIdArray(entry, field);
      for (const refId of refIds) {
        const refEntry = await this.env.getEntry(refId);
        await this.Traverse(refEntry);
      }
    }
  }

  async TraverseFromURL(url: string) {
    const course_entries = await this.env.getEntries({
      content_type: "course",
    });
    const this_course_entry: Entry = course_entries.items.find(
      (e) => GetFieldValue(e, "slug") === url
    );
    if (!this_course_entry) {
      console.log(`No course with URL='${url}' found`);
      return;
    }
    await this.Traverse(this_course_entry);
  }
}

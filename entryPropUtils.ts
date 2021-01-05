import {
  ContentFields,
  CreateEntryProps,
  Entry,
  EntryProps,
} from "contentful-management/types";
import { IsReferenceArray } from "./fieldUtils";

const CONTENTFUL_LOCALE_DEFAULT = "en";

export function GetFieldValue(
  entry: CreateEntryProps,
  fieldId: string,
  locale: string = CONTENTFUL_LOCALE_DEFAULT
): any {
  return entry.fields[fieldId] && entry.fields[fieldId][locale];
}

//returns true if something changed, returns false if nothing changed
export function SetFieldValue(
  entry: CreateEntryProps,
  fieldId: string,
  val: any,
  locale: string = CONTENTFUL_LOCALE_DEFAULT
): void {
  if (!entry.fields[fieldId]) {
    entry.fields[fieldId] = { [locale]: val }; //nothing at this field, so set it at this locale
    return;
  }
  //assign value at the right field and locale
  entry.fields[fieldId][locale] = val;
}

export function getTypeIdFromEntry(entry: Entry): string {
  return entry.sys.contentType.sys.id;
}

export function GetReferenceIdArray(
  entry: EntryProps,
  typeField: ContentFields,
  locale: string = CONTENTFUL_LOCALE_DEFAULT
): string[] {
  const isArray = IsReferenceArray(typeField);
  const fieldValue = GetFieldValue(entry, typeField.id, locale);
  if (fieldValue == null) return [];
  return isArray ? fieldValue.map((m) => m.sys.id) : [fieldValue.sys.id];
}

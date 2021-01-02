import { CreateEntryProps } from "contentful-management/types";

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

import { CreateEntryProps, EntryProps } from "contentful-management/types";

const CONTENTFUL_LOCALE_DEFAULT = "en";

export function CreateLinkSysObject(linkToId: string): object {
  if (linkToId == null) return undefined;
  return {
    sys: {
      type: "Link",
      linkType: "Entry",
      id: linkToId,
    },
  };
}

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
): boolean {
  if (!HasFields(entry, fieldId)) {
    if (val == null) return false;
    entry.fields[fieldId] = { [locale]: val }; //nothing at this field, so set it at this locale
    return true;
  }
  const oldVal = GetFieldValue(entry, fieldId, locale);
  if (oldVal && JSON.stringify(oldVal) === JSON.stringify(val)) {
    return false; //this field + this locale already contains the correct value
  }
  //this field exists but has the wrong value at this locale, add entry
  entry.fields[fieldId][locale] = val;
  return true;
}

export function SetLinkValue(
  entry: CreateEntryProps,
  fieldId: string,
  linkToId: string,
  localeCode: string = CONTENTFUL_LOCALE_DEFAULT
): boolean {
  let sysObject = CreateLinkSysObject(linkToId);
  return SetFieldValue(entry, fieldId, sysObject, localeCode);
}

export function SetLinkValueAtIndex(
  entry: EntryProps,
  fieldId: string,
  linkToId: string,
  localeCode: string,
  arrayIndex: number
) {
  let sysObject = CreateLinkSysObject(linkToId);
  let fieldRef = entry.fields[fieldId];
  if (fieldRef[localeCode] == undefined) {
    fieldRef[localeCode] = [sysObject];
  } else {
    fieldRef[localeCode][arrayIndex] = sysObject;
  }
}

export function SetLink(
  entry: EntryProps,
  fieldId: string,
  linkToId: string,
  localeCode: string,
  arrayIndex?: number
) {
  if (typeof arrayIndex === "number")
    SetLinkValueAtIndex(entry, fieldId, linkToId, localeCode, arrayIndex);
  else SetLinkValue(entry, fieldId, linkToId, localeCode);
}

export function HasFields(entry: CreateEntryProps, fieldId: string): boolean {
  return entry.fields[fieldId];
}

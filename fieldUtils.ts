import { ContentFields, ContentType } from "contentful-management/types";

export function IsTextField(field: ContentFields): boolean {
  return field.type === "Symbol" || field.type === "Text";
}

export function IsLocalizedField(field: ContentFields): boolean {
  return field.localized;
}

export function IsReference(field: ContentFields): boolean {
  return field.type === "Link" && field.linkType === "Entry";
}

export function IsReferenceArray(field: ContentFields): boolean {
  return (
    field.type === "Array" &&
    field.items.type === "Link" &&
    field.items.linkType === "Entry"
  );
}

export function IsLocalizableReferenceOrArrayField(
  f: ContentFields,
  referencesAreArrays: boolean
): boolean {
  return referencesAreArrays
    ? IsReferenceArray(f) && IsLocalizedField(f)
    : IsReference(f) && IsLocalizedField(f);
}

export function IsReferenceOrReferenceArray(f: ContentFields): boolean {
  return IsReference(f) || IsReferenceArray(f);
}

export function IsTraversable(f: ContentFields): boolean {
  return (
    (IsLocalizedField(f) && IsReference(f)) ||
    (!IsLocalizedField(f) && IsReferenceOrReferenceArray(f))
  );
}

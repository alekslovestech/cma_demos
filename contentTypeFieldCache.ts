import { ContentFields, Environment } from "contentful-management/types";
import {
  IsLocalizableReferenceOrArrayField,
  IsLocalizedField,
  IsReferenceOrReferenceArray,
  IsTextField,
  IsTraversable,
} from "./fieldUtils";

export class ContentTypeFieldCache {
  constructor(private env: Environment) {
    this.fieldInfo = {};
  }

  async Init() {
    const types = await this.env.getContentTypes({ limit: 200 });
    for (const type of types.items) {
      this.fieldInfo[type.sys.id] = type.fields as ContentFields[];
    }
  }

  HasField(typeId: string, fieldId: string): boolean {
    const theList = this.fieldInfo[typeId].filter((f) => f.id === fieldId);
    return theList.length > 0;
  }

  //unlocalized references are traversable
  GetTraversableFields(typeId: string): ContentFields[] {
    return this.fieldInfo[typeId].filter((f) => IsTraversable(f));
  }

  GetLocalizableTextFields(typeId: string): ContentFields[] {
    return this.fieldInfo[typeId].filter(
      (f) => IsLocalizedField(f) && IsTextField(f)
    );
  }

  GetReferenceFields(typeId): ContentFields[] {
    return this.GetAllFields(typeId).filter((f) =>
      IsReferenceOrReferenceArray(f)
    );
  }

  GetLocalizedReferences(
    typeId: string,
    referencesAreArrays: boolean
  ): ContentFields[] {
    return this.GetAllFields(typeId).filter((f) =>
      IsLocalizableReferenceOrArrayField(f, referencesAreArrays)
    );
  }

  private GetAllFields(typeId: string): ContentFields[] {
    return this.fieldInfo[typeId];
  }

  private readonly fieldInfo: { [typeId: string]: ContentFields[] };
}

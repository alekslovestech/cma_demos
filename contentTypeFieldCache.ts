import { ContentFields, Environment } from "contentful-management/types";
import { IsLocalizedField, IsTextField, IsTraversable } from "./fieldUtils";

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

  //unlocalized references are traversable
  GetTraversableFields(typeId: string): ContentFields[] {
    return this.fieldInfo[typeId].filter((f) => IsTraversable(f));
  }

  GetLocalizableTextFields(typeId: string): ContentFields[] {
    return this.fieldInfo[typeId].filter(
      (f) => IsLocalizedField(f) && IsTextField(f)
    );
  }

  private readonly fieldInfo: { [typeId: string]: ContentFields[] };
}

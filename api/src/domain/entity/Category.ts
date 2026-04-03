/**
 * Category domain entity.
 */
export type CategoryRecord = {
  id?: string | null;
  name: string;
  icon?: string | null;
  created_at?: string | null;
};

export class Category {
  id: string | null;
  name: string;
  icon: string | null;
  created_at: string | null;

  constructor({ id = null, name, icon = null, created_at = null }: CategoryRecord) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }
}

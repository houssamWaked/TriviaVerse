/**
 * Category domain entity.
 */
export type CategoryRecord = {
  id?: string | null;
  name: string;
  icon?: string | null;
  created_at?: string | null;
};

// Domain model for a trivia category.
export class Category {
  id: string | null;
  name: string;
  icon: string | null;
  created_at: string | null;

  /**
   * Create a `Category` entity from a database row.
   * @param record Raw category record from the database.
   * @returns A normalized `Category` instance.
   */
  constructor({ id = null, name, icon = null, created_at = null }: CategoryRecord) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }
}

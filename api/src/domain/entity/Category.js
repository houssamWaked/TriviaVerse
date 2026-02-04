/**
 * Category domain entity.
 *
 * Entities represent the data as it exists in the domain layer (and typically
 * mirrors the database schema closely).
 *
 * Note: This project currently keeps timestamps in snake_case to match DB.
 */
export class Category {
  constructor({ id = null, name, icon = null, created_at = null }) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }
}

/**
 * Category Data Transfer Object (DTO).
 *
 * DTOs define the exact response shape returned by the API to clients.
 * Keeping DTOs explicit avoids leaking internal entity details accidentally.
 *
 * Casing:
 * - Currently uses `created_at` (snake_case) to match the DB column.
 *   If you prefer JS-style camelCase, map it here instead.
 */
export default class CategoryDTO {
  constructor({ id, name, icon, created_at }) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }

  /**
   * Convert a domain entity into a DTO.
   * @param {{id: string, name: string, icon: (string|null), created_at: (string|null)}} entity
   * @returns {CategoryDTO}
   */
  static fromEntity(entity) {
    return new CategoryDTO(entity);
  }

  /**
   * Convert multiple entities into DTOs.
   * @param {Array<object>} entities
   * @returns {CategoryDTO[]}
   */
  static fromEntities(entities = []) {
    return entities.map((e) => CategoryDTO.fromEntity(e));
  }
}

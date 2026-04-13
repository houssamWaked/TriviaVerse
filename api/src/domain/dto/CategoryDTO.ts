/**
 * Category Data Transfer Object (DTO).
 */
import type { CategoryRecord } from '../entity/Category.js';

type CategoryDtoSource = Required<Pick<CategoryRecord, 'name'>> &
  Pick<CategoryRecord, 'id' | 'icon' | 'created_at'>;

// Client-facing category shape for API responses.
export default class CategoryDTO {
  id: string | null | undefined;
  name: string;
  icon: string | null | undefined;
  created_at: string | null | undefined;

  /**
   * Create a category DTO.
   * @param source Category fields safe to return to clients.
   * @returns A `CategoryDTO` instance.
   */
  constructor({ id, name, icon, created_at }: CategoryDtoSource) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }

  /**
   * Convert a category entity/row into a DTO.
   * @param entity Category-like source.
   * @returns A `CategoryDTO`.
   */
  static fromEntity(entity: CategoryDtoSource): CategoryDTO {
    return new CategoryDTO(entity);
  }

  /**
   * Convert multiple category entities/rows into DTOs.
   * @param entities Category-like sources.
   * @returns Array of `CategoryDTO`.
   */
  static fromEntities(entities: CategoryDtoSource[] = []): CategoryDTO[] {
    return entities.map((entity) => CategoryDTO.fromEntity(entity));
  }
}

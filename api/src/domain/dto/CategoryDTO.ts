/**
 * Category Data Transfer Object (DTO).
 */
import type { CategoryRecord } from '../entity/Category.js';

type CategoryDtoSource = Required<Pick<CategoryRecord, 'name'>> &
  Pick<CategoryRecord, 'id' | 'icon' | 'created_at'>;

export default class CategoryDTO {
  id: string | null | undefined;
  name: string;
  icon: string | null | undefined;
  created_at: string | null | undefined;

  constructor({ id, name, icon, created_at }: CategoryDtoSource) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.created_at = created_at;
  }

  static fromEntity(entity: CategoryDtoSource): CategoryDTO {
    return new CategoryDTO(entity);
  }

  static fromEntities(entities: CategoryDtoSource[] = []): CategoryDTO[] {
    return entities.map((entity) => CategoryDTO.fromEntity(entity));
  }
}

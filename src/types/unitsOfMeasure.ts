export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  isSystem: boolean;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitOfMeasureRequest {
  name: string;
  abbreviation: string;
}

export interface UpdateUnitOfMeasureRequest {
  name?: string;
  abbreviation?: string;
}

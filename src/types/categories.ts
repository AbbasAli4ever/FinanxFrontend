export interface Category {
  id: string;
  name: string;
  description: string | null;
  depth: number;
  fullPath: string | null;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  children: Category[];
  productsCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

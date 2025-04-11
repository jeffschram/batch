export type Recipe = {
  id: string;
  name: string;
  notes: string;
  created_on: string;
  user_id: string;
  image_url?: string;
};

export type Batch = {
  id: string;
  recipe_id: string;
  created_on: string;
  name: string;
  notes?: string;
  batch_number: number;
};

export type Step = {
  id: string;
  batch_id: string;
  step_number: number;
  description: string;
  note?: string;
};

export type Ingredient = {
  id: string;
  batch_id: string;
  ingredient_name: string;
  note?: string;
};
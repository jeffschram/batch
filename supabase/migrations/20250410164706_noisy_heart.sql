/*
  # Add Batches, Steps, and Ingredients Tables

  1. New Tables
    - `batches`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, foreign key to recipes)
      - `created_on` (timestamp)
      - `name` (text)
      - `notes` (text)
      - `batch_number` (integer)

    - `steps`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches)
      - `step_number` (integer)
      - `description` (text)
      - `note` (text)

    - `ingredients`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches)
      - `amount` (numeric)
      - `unit` (text)
      - `ingredient_name` (text)
      - `note` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_on timestamptz DEFAULT now(),
  name text NOT NULL,
  notes text,
  batch_number integer NOT NULL
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage batches for their recipes"
  ON batches
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = batches.recipe_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = batches.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Create steps table
CREATE TABLE IF NOT EXISTS steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  description text NOT NULL,
  note text
);

ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage steps for their batches"
  ON steps
  USING (
    EXISTS (
      SELECT 1 FROM batches
      JOIN recipes ON recipes.id = batches.recipe_id
      WHERE batches.id = steps.batch_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      JOIN recipes ON recipes.id = batches.recipe_id
      WHERE batches.id = steps.batch_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  amount numeric,
  unit text,
  ingredient_name text NOT NULL,
  note text
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ingredients for their batches"
  ON ingredients
  USING (
    EXISTS (
      SELECT 1 FROM batches
      JOIN recipes ON recipes.id = batches.recipe_id
      WHERE batches.id = ingredients.batch_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      JOIN recipes ON recipes.id = batches.recipe_id
      WHERE batches.id = ingredients.batch_id
      AND recipes.user_id = auth.uid()
    )
  );
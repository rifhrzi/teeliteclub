<<<<<<< HEAD
-- Add size chart column to products table
ALTER TABLE products 
ADD COLUMN size_chart JSONB DEFAULT NULL;

-- Add comment to explain the size chart structure
=======
-- Add size chart column to products table
ALTER TABLE products 
ADD COLUMN size_chart JSONB DEFAULT NULL;

-- Add comment to explain the size chart structure
>>>>>>> c78eca0 (Update Maintenance)
COMMENT ON COLUMN products.size_chart IS 'Size chart data stored as JSONB with structure: {"measurements": [{"name": "Chest", "unit": "cm"}, ...], "sizes": {"S": {"Chest": "90-95"}, ...}}';
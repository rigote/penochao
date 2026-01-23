-- Migration: Convert amount fields from numeric to text to support encryption
-- This migration converts the amount columns in expense and income tables from numeric to text

-- Convert expense.amount from numeric to text
ALTER TABLE "expense" 
  ALTER COLUMN "amount" TYPE text USING "amount"::text;

-- Convert income.amount from numeric to text  
ALTER TABLE "income"
  ALTER COLUMN "amount" TYPE text USING "amount"::text;

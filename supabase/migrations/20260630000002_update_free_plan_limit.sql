-- Update the free plan product limit to 25
UPDATE public.plans
SET product_limit = 25
WHERE code = 'free';

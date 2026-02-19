-- Allow MALL_TRANSFER (and SWAP_OUT, SWAP_IN if used) in transactions.type
-- Run in Supabase SQL Editor. Constraint name may vary; if it fails, check:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.transactions'::regclass AND contype = 'c';

ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN (
  'SIGNUP_BONUS',
  'REFERRAL_BONUS',
  'ADMIN_GRANT',
  'CONVERSION',
  'SWAP_OUT',
  'SWAP_IN',
  'MALL_TRANSFER'
));

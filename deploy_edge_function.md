# Deploy recover-payment-url Edge Function

## Step 1: Set Supabase Secrets

The Edge Function needs access to Midtrans credentials. Set these secrets in your Supabase project:

```bash
# Login to Supabase CLI
npx supabase login

# Set the secrets (use your actual values from .env)
npx supabase secrets set MIDTRANS_SERVER_KEY="Mid-server-YOUR_ACTUAL_SERVER_KEY"
npx supabase secrets set MIDTRANS_SERVER_KEY_SANDBOX="Mid-server-YOUR_SANDBOX_KEY"
npx supabase secrets set VITE_APP_ENV="production"
npx supabase secrets set VITE_APP_URL="https://teeliteclub.onrender.com"
```

## Step 2: Deploy the Function

```bash
# Deploy the recover-payment-url function
npx supabase functions deploy recover-payment-url --project-ref ngucthauvvjajdjcdrvl
```

## Step 3: Test the Function

After deployment, test it with:

```bash
# Test with the problematic order
curl -X POST 'https://ngucthauvvjajdjcdrvl.supabase.co/functions/v1/recover-payment-url' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"order_id": "570564ce-ef67-4dc3-95c1-ae654f2b2e7c"}'
```

## Alternative: Manual Deployment via Supabase Dashboard

If CLI doesn't work:

1. Go to https://supabase.com/dashboard/project/ngucthauvvjajdjcdrvl/functions
2. Click "Create Function"
3. Name: `recover-payment-url`
4. Copy the code from `supabase/functions/recover-payment-url/index.ts`
5. Set environment variables in the dashboard
6. Deploy

## Environment Variables Needed:

From your .env file, these are needed for the Edge Function:
- `MIDTRANS_SERVER_KEY` (production)
- `MIDTRANS_SERVER_KEY_SANDBOX` (sandbox)
- `VITE_APP_ENV` (production/development)
- `VITE_APP_URL` (your app URL)
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

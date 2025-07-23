// Test script for recover-payment-url Edge Function
// Run this in browser console while logged in to test the function

async function testRecoveryFunction() {
  const orderId = '570564ce-ef67-4dc3-95c1-ae654f2b2e7c'; // The problematic order
  
  console.log('🧪 Testing recover-payment-url function...');
  console.log('Order ID:', orderId);
  
  try {
    // Get current user session
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ User not logged in');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Call the recovery function
    console.log('🔄 Calling recover-payment-url function...');
    
    const { data, error } = await window.supabase.functions.invoke('recover-payment-url', {
      body: { order_id: orderId }
    });
    
    if (error) {
      console.error('❌ Function error:', error);
      return;
    }
    
    console.log('✅ Function response:', data);
    
    if (data.success && data.payment_url) {
      console.log('🎉 SUCCESS! Payment URL recovered:', data.payment_url);
      console.log('🔗 Opening payment URL...');
      window.open(data.payment_url, '_blank');
    } else {
      console.log('⚠️ Function completed but no payment URL returned');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Instructions:
console.log(`
🧪 RECOVERY FUNCTION TEST INSTRUCTIONS:

1. Make sure you're logged in as: sultannfaturahman@gmail.com
2. Open browser console (F12)
3. Paste this entire script
4. Run: testRecoveryFunction()
5. Check the console output

Expected result: New Midtrans payment URL should be generated and opened.
`);

// Auto-run if this is being executed directly
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🚀 Auto-running test...');
  testRecoveryFunction();
}

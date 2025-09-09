// IAGN Supabase Client - Separate database for positive news platform
import { createClient } from '@supabase/supabase-js';

// IAGN-specific Supabase configuration
const SUPABASE_URL = process.env.IAGN_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.IAGN_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing IAGN Supabase environment variables:');
  console.error('- IAGN_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('- IAGN_SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  throw new Error('IAGN Supabase configuration incomplete');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { 
    persistSession: false 
  },
  global: { 
    headers: { 
      'x-application-name': 'iagn-backend-processor'
    } 
  }
});

// Test connection on startup
supabase
  .from('stories')
  .select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('IAGN Supabase connection failed:', error.message);
    } else {
      console.log(`IAGN Supabase connected successfully. Stories table has ${count || 0} records.`);
    }
  })
  .catch(error => {
    console.error('IAGN Supabase connection test failed:', error);
  });

export default supabase;

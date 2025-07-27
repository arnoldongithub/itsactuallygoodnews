import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcdapfobdsqvzmagimvr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZGFwZm9iZHNxdnptYWdpbXZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA3MTQwMSwiZXhwIjoyMDY1NjQ3NDAxfQ.tXgdzhhwr_TlsLG_4ydReOPgGdaZyYz9oU8-wbNcdgY';

export const supabase = createClient(supabaseUrl, supabaseKey);

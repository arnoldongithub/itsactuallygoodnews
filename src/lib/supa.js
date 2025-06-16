import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcdapfobdsqvzmagimvr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZGFwZm9iZHNxdnptYWdpbXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzE0MDEsImV4cCI6MjA2NTY0NzQwMX0.VLIavDgWnoNA-4LLfKZ7P6kGAW-YiASz50dFXyX_MCw';

export const supabase = createClient(supabaseUrl, supabaseKey);


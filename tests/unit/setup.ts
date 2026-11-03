import 'fake-indexeddb/auto';

// Unit tests use explicit service stubs and never connect to hosted Supabase.
delete import.meta.env.VITE_SUPABASE_URL;
delete import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

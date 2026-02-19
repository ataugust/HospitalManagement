

import { createClient } from '@supabase/supabase-js'

// ⚠️ GO TO YOUR MOBILE APP CODE (lib/supabase.js) AND COPY THESE KEYS
const supabaseUrl = 'https://hyuryheredecnknocpbc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dXJ5aGVyZWRlY25rbm9jcGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTQxMTIsImV4cCI6MjA4Njk3MDExMn0.UInLpgLSAKV9xCXHHi2y2Pri3cPtjkYV9nH9AUKUloA'

export const supabase = createClient(supabaseUrl, supabaseKey)
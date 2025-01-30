import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://lsobosbpvgsmqnvakhmk.supabase.co'

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzb2Jvc2JwdmdzbXFudmFraG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3Njc1ODYsImV4cCI6MjA1MjM0MzU4Nn0.EG8E7vNJsDSfE-x7BuOH99fkcVG_vPtsf60beQvwtGA"


export const supabase = createClient(supabaseUrl, supabaseKey)

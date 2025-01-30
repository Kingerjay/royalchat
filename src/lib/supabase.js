import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://lsobosbpvgsmqnvakhmk.supabase.co'

const supabaseKey = import.meta.env.VITE_API_KEYS


export const supabase = createClient(supabaseUrl, supabaseKey)

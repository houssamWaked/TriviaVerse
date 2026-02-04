import 'dotenv/config';
import express from 'express';
import { supabaseAdmin } from './config/supabase.js';
const app = express();
app.use(express.json());

app.get('/health/db', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, data });
});

app.listen(3000, () => console.log('Server running on port 3000'));

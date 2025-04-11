// Импортируем Supabase правильно для Vercel
const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Генерация промокода
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let attempts = 0;

    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;

      if (attempts > 10) {
        return res.status(500).json({ error: 'Не удалось сгенерировать уникальный код' });
      }

      const { data: exists } = await supabase
        .from('promocodes')
        .select('code')
        .eq('code', code)
        .single();

      if (!exists) break;
    } while (true);

    // Сохраняем в Supabase
    const { data, error } = await supabase
      .from('promocodes')
      .insert([{
        code,
        device_id: req.query.device_id || null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ code: data[0].code });
  }
  else if (req.method === 'POST') {
    // Проверка промокода
    const { code } = req.body;

    if (!code || code.length !== 5) {
      return res.status(400).json({ valid: false, error: 'Неверный формат кода' });
    }

    const { data, error } = await supabase
      .from('promocodes')
      .select('*')
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return res.json({ valid: false });
    }

    return res.json({
      valid: true,
      code: data.code,
      created_at: data.created_at,
      expires_at: data.expires_at,
      is_used: data.is_used
    });
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    res.status(405).json({ error: 'Метод не разрешен' });
  }
};

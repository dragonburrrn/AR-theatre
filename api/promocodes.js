import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Генерация нового промокода
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code, attempts = 0
    
    do {
      code = ''
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      attempts++
      
      // Защита от бесконечного цикла
      if (attempts > 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' })
      }
      
      // Проверка уникальности
      const { data: existing } = await supabase
        .from('promocodes')
        .select('code')
        .eq('code', code)
        .single()
        
    } while (existing)

    // Сохранение в Supabase
    const { data, error } = await supabase
      .from('promocodes')
      .insert([{ 
        code,
        device_id: req.query.device_id || null 
      }])
      .select()
      
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    
    return res.json({ code: data[0].code })
  }
  else if (req.method === 'POST') {
    // Проверка промокода театром
    const { code } = req.body
    
    if (!code || code.length !== 5) {
      return res.status(400).json({ valid: false, error: 'Invalid code format' })
    }
    
    // Поиск промокода
    const { data, error } = await supabase
      .from('promocodes')
      .select('*')
      .eq('code', code)
      .single()
      
    if (error || !data) {
      return res.json({ valid: false })
    }
    
    // Возвращаем результат проверки
    return res.json({
      valid: true,
      code: data.code,
      created_at: data.created_at,
      is_used: data.is_used
    })
  }
  else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}
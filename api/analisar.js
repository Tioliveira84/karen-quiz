// api/analisar.js
// Essa função roda no servidor do Vercel — a chave Claude fica segura aqui
// O cliente nunca vê a chave, só o resultado da análise

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Chave Claude vem das variáveis de ambiente do Vercel (configuradas lá no painel)
  const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  try {
    const { prompt, tipo } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt não enviado.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: tipo === 'karen' ? 1600 : 1400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    const texto = data.content.map(x => x.text || '').join('').replace(/```json|```/g, '').trim();
    const resultado = JSON.parse(texto);

    return res.status(200).json({ ok: true, resultado });

  } catch (e) {
    console.error('[analisar.js]', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}

/**
 * Prueba rápida de OPENAI_API_KEY (no imprime el secreto).
 * Uso: npx tsx src/probarOpenAI.ts
 */
import { config } from './config.js';

async function main() {
  const key = config.openaiApiKey?.trim();
  const model = config.openaiModel;
  console.log('key_presente', Boolean(key));
  console.log('key_prefijo', key ? `${key.slice(0, 7)}…` : '(vacía)');
  console.log('key_longitud', key.length);
  console.log('modelo', model);

  if (!key) {
    console.error('Sin OPENAI_API_KEY en .env');
    process.exit(1);
  }

  const modelsRes = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const modelsBody = await modelsRes.text();
  console.log('modelo_http', modelsRes.status);
  if (!modelsRes.ok) {
    console.log('modelo_error', modelsBody.slice(0, 400));
  } else {
    const j = JSON.parse(modelsBody) as { id?: string };
    console.log('modelo_ok', j.id || model);
  }

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Responde solo JSON.' },
        { role: 'user', content: 'Devuelve {"ok":true,"msg":"TuMirada OpenAI OK"}' },
      ],
      max_tokens: 40,
      temperature: 0,
    }),
  });
  const chatBody = await chatRes.text();
  console.log('chat_http', chatRes.status);
  if (!chatRes.ok) {
    console.log('chat_error', chatBody.slice(0, 500));
    process.exit(1);
  }
  const chat = JSON.parse(chatBody) as {
    choices?: { message?: { content?: string } }[];
    usage?: unknown;
  };
  console.log('chat_content', chat.choices?.[0]?.message?.content);
  console.log('usage', JSON.stringify(chat.usage || {}));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

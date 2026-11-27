export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ApexDesk Multi-Level AI Agent 24/7 Backend is Online!' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const GEMINI_API_KEY = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.GEMINI_API_KEY || 'AQ.Ab8RN6LtxoAg3mwRZ8C6oxSNQVUZICUG7hgM9mk5RsEq0SZA6Q';
    const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/4mhh1m1eha2f8';
    const TELEGRAM_BOT_TOKEN = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.TELEGRAM_BOT_TOKEN || '9272085514:AAE0mu6Yd47N3dNXSH2n20c-MIJ7Zckhrs';
    const TELEGRAM_CHAT_ID = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.TELEGRAM_CHAT_ID || '6202497965';
    const BREVO_API_KEY = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.BREVO_API_KEY;
    const SENDER_EMAIL = 'saiuday8161@gmail.com';

    const data = await req.json();
    const userMessage = data.message || data.chatInput || data.prompt || '';
    const userEmail = data.email || '';
    const userName = data.name || 'Customer';
    const userPhone = data.phone || '';

    if (!userMessage) {
      return new Response(
        JSON.stringify({ output: 'Please enter a message for ApexDesk AI.', reply: 'Please enter a message for ApexDesk AI.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const systemInstruction = `You are ApexDesk AI, an enterprise multi-level business automation assistant built by Sai Uday.
Analyze the user's message and respond ONLY in valid JSON format with these exact keys:
{
  "action": "CHAT" or "LOG_ORDER_OR_LEAD" or "BOOK_MEETING",
  "details": "short summary of order, inquiry, or meeting topic",
  "reply": "helpful, polite response to show the user"
}
Use LOG_ORDER_OR_LEAD when the user places an order, shares contact details, or asks for pricing/demo.
Use BOOK_MEETING when the user wants to schedule a call or appointment.
Otherwise use CHAT.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nUser Name: ${userName}\nUser Email: ${userEmail}\nMessage: ${userMessage}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const geminiJson = await geminiRes.json();
    const aiText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || '{"action":"CHAT","details":"","reply":"Sorry, I could not process that."}';
    const aiDecision = JSON.parse(aiText);

    let actionSummary = '';
    if (aiDecision.action === 'LOG_ORDER_OR_LEAD' || aiDecision.action === 'BOOK_MEETING') {
      const targetSheet = aiDecision.action === 'BOOK_MEETING' ? 'Sheet2' : 'Sheet1';
      await fetch(`${SHEETDB_API_URL}?sheet=${targetSheet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{ Name: userName, Email: userEmail, Phone: userPhone, Requirement: aiDecision.details }],
        }),
      });

      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: `New ApexDesk Request:\nName: ${userName}\nEmail: ${userEmail || 'N/A'}\nPhone: ${userPhone || 'N/A'}\nDetails: ${aiDecision.details}`,
          }),
        });
      }

      if (userEmail && BREVO_API_KEY) {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
          body: JSON.stringify({
            sender: { name: 'ApexDesk AI', email: SENDER_EMAIL },
            to: [{ email: userEmail, name: userName }],
            subject: 'ApexDesk AI - Confirmation',
            textContent: `Hi ${userName},\n\nThank you for connecting with ApexDesk AI.\n\nDetails: ${aiDecision.details}\n\nRegards,\nApexDesk AI Team`,
          }),
        });
      }
      actionSummary = ' (Saved to Sheets & Notified Team)';
    }

    return new Response(
      JSON.stringify({ output: aiDecision.reply, reply: aiDecision.reply, status: 'success' + actionSummary }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ output: 'ApexDesk AI issue: ' + err.message, reply: 'ApexDesk AI issue: ' + err.message, status: 'error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
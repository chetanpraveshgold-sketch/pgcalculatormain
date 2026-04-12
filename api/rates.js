// Vercel Serverless Function: api/rates.js
export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const gsheetUrl = process.env.RATES_URL;
  if (!gsheetUrl) return response.status(500).json({ error: 'System Configuration Error (RATES_URL)' });

  try {
    const gResponse = await fetch(gsheetUrl, { redirect: 'follow' });
    const data = await gResponse.json();
    
    if (data.error) return response.status(500).json({ error: data.error });

    const clean = (val) => {
      if (val === undefined || val === null) return 0;
      return parseFloat(val.toString().replace(/[^\d.]/g, '')) || 0;
    };

    return response.status(200).json({
      date: data.sheet_date,
      rates: {
        rate_22k: clean(data.rate_22k),
        rate_24k: clean(data.rate_24k),
        rate_18k: clean(data.rate_18k),
        rate_silver: clean(data.rate_silver)
      }
    });
  } catch (error) {
    return response.status(500).json({ error: 'Live Sync offline. Please refresh.' });
  }
}

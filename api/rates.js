// Vercel Serverless Function: api/rates.js
export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const gsheetUrl = process.env.RATES_URL;
  if (!gsheetUrl) {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(500).json({ error: 'System Configuration Error (RATES_URL)' });
  }

  try {
    const gResponse = await fetch(gsheetUrl, { redirect: 'follow' });
    const data = await gResponse.json();
    
    if (data.error) {
      response.setHeader('Cache-Control', 'no-store');
      return response.status(500).json({ error: data.error });
    }

    const clean = (val) => {
      if (val === undefined || val === null) return 0;
      return parseFloat(val.toString().replace(/[^\d.]/g, '')) || 0;
    };

    // Smart Mapping: Identify which field is the date and which is silver
    let silverRate = clean(data.rate_silver || data.sheet_time || data.Silver);
    let dateVal = data.sheet_date;

    // If silverRate looks like a massive number (date serial) and dateVal looks like a small number (price)
    if (silverRate > 1000000 && clean(dateVal) < 10000) {
        silverRate = clean(dateVal);
        dateVal = new Date().toISOString(); // Recover using current date
    }

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response.status(200).json({
      date: dateVal,
      rates: {
        rate_22k: clean(data.rate_22k),
        rate_24k: clean(data.rate_24k),
        rate_18k: clean(data.rate_18k),
        rate_silver: silverRate
      }
    });
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(500).json({ error: 'Live Sync offline. Please refresh.' });
  }
}

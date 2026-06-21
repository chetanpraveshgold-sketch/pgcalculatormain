const sharp = require('sharp');
const fs = require('fs');

async function processImage() {
  const meta = await sharp('praveshgoldlogopng.png').metadata();
  console.log(`Dimensions: ${meta.width}x${meta.height}`);
  
  await sharp('praveshgoldlogopng.png')
    .webp({ quality: 80 })
    .toFile('praveshgoldlogopng.webp');
    
  console.log('Successfully created praveshgoldlogopng.webp');
}

processImage().catch(console.error);

import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.PHOTOROOM_API_KEY;
console.log('API Key vorhanden:', !!API_KEY);
console.log('API Key (erste 10 Zeichen):', API_KEY?.substring(0, 10));

// Lade das Testbild
const imageBuffer = readFileSync('/home/ubuntu/upload/search_images/2Db8kW7o8x96.jpg');
console.log('Bild geladen, Größe:', imageBuffer.length, 'bytes');

// Build multipart form data
const boundary = `----FormBoundary${Date.now()}`;
const parts = [];

// Add the image file
parts.push(Buffer.from(
  `--${boundary}\r\nContent-Disposition: form-data; name="image_file"; filename="input.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
));
parts.push(imageBuffer);
parts.push(Buffer.from("\r\n"));

// Request PNG format with transparency
parts.push(Buffer.from(
  `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng\r\n`
));

// Request transparent channels
parts.push(Buffer.from(
  `--${boundary}\r\nContent-Disposition: form-data; name="channels"\r\n\r\nrgba\r\n`
));

// Close boundary
parts.push(Buffer.from(`--${boundary}--\r\n`));

const body = Buffer.concat(parts);

console.log('Sende Request an PhotoRoom API...');

const response = await fetch("https://sdk.photoroom.com/v1/segment", {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    Accept: "image/png",
  },
  body,
});

console.log('Response Status:', response.status);
console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

if (!response.ok) {
  const errorText = await response.text();
  console.error('FEHLER:', errorText);
  process.exit(1);
}

const resultBuffer = Buffer.from(await response.arrayBuffer());
console.log('Ergebnis-Größe:', resultBuffer.length, 'bytes');

// Prüfe ob es ein PNG ist (Magic bytes: 89 50 4E 47)
const isPng = resultBuffer[0] === 0x89 && resultBuffer[1] === 0x50 && resultBuffer[2] === 0x4E && resultBuffer[3] === 0x47;
console.log('Ist PNG:', isPng);

// Speichere das Ergebnis
writeFileSync('/home/ubuntu/test-freigestellt.png', resultBuffer);
console.log('Ergebnis gespeichert als /home/ubuntu/test-freigestellt.png');

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/trikot-konfigurator/.env' });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Mapping: templateId -> neue Bilder
const imageMap = {
  'fussball_dtf': {
    vorderteil: '/manus-storage/fussball_front_8452f3c3.png',
    rueckteil: '/manus-storage/fussball_back_d24ca9df.png',
    aermel_links: '/manus-storage/fussball_aermel_links_832ef2a4.png',
    aermel_rechts: '/manus-storage/fussball_aermel_rechts_3bdb550b.png',
  },
  'handball_dtf': {
    vorderteil: '/manus-storage/handball_front_ee897f3c.png',
    rueckteil: '/manus-storage/handball_back_3d1d47cb.png',
    aermel_links: '/manus-storage/handball_aermel_links_b61658a7.png',
    aermel_rechts: '/manus-storage/handball_aermel_rechts_44c4a141.png',
  },
  'volleyball_dtf': {
    vorderteil: '/manus-storage/volleyball_front_4aa3a7dd.png',
    rueckteil: '/manus-storage/volleyball_back_d241fc6b.png',
  },
  'basketball_dtf': {
    vorderteil: '/manus-storage/basketball_front_81321f1e.png',
    rueckteil: '/manus-storage/basketball_back_a2067eb9.png',
  },
};

// Finde alle DTF-Produkte
const [products] = await conn.execute("SELECT id, name, templateId FROM products WHERE templateId LIKE '%dtf%' AND templateId NOT LIKE '%svg%' AND published = 1");
console.log('DTF-Produkte (published):');
products.forEach(p => console.log(p.id, p.name, p.templateId));

for (const product of products) {
  const images = imageMap[product.templateId];
  if (!images) {
    console.log('Kein Mapping für:', product.templateId);
    continue;
  }
  
  // Finde die Parts dieses Produkts
  const [parts] = await conn.execute('SELECT id, `key`, imageUrl FROM product_parts WHERE productId = ? ORDER BY sortOrder', [product.id]);
  console.log('  Parts für', product.name, ':', parts.map(p => p.key + ' = ' + p.imageUrl).join(', '));
  
  for (const part of parts) {
    const newUrl = images[part.key];
    if (newUrl && part.imageUrl !== newUrl) {
      await conn.execute('UPDATE product_parts SET imageUrl = ? WHERE id = ?', [newUrl, part.id]);
      console.log('  Updated:', part.key, '->', newUrl);
    }
  }
  
  // Auch das Produkt frontImageUrl/backImageUrl aktualisieren
  await conn.execute('UPDATE products SET frontImageUrl = ?, backImageUrl = ? WHERE id = ?', [images.vorderteil, images.rueckteil, product.id]);
  console.log('  Product images updated');
}

await conn.end();
console.log('Done!');

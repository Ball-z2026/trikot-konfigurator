import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check current hash
const [rows] = await conn.execute('SELECT id, email, passwordHash FROM users WHERE email = ?', ['owner@tsv-musterstadt.de']);
console.log('Found user:', rows[0]?.id, rows[0]?.email);
console.log('Has hash:', !!rows[0]?.passwordHash);

if (rows[0]?.passwordHash) {
  const match = await bcrypt.compare('test1234', rows[0].passwordHash);
  console.log('Current password matches test1234:', match);
}

// Reset password
const newHash = await bcrypt.hash('test1234', 12);
await conn.execute('UPDATE users SET passwordHash = ? WHERE email = ?', [newHash, 'owner@tsv-musterstadt.de']);
console.log('Password reset to test1234');

// Verify
const [rows2] = await conn.execute('SELECT passwordHash FROM users WHERE email = ?', ['owner@tsv-musterstadt.de']);
const match2 = await bcrypt.compare('test1234', rows2[0].passwordHash);
console.log('Verification:', match2);

await conn.end();

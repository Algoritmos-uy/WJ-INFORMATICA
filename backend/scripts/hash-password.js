// Genera el hash scrypt de una contraseña para ADMIN_PASSWORD_HASH en .env
// Uso: node backend/scripts/hash-password.js
import { scrypt, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question('Contraseña: ', async (password) => {
  rl.close();
  if (!password) { console.error('Contraseña vacía.'); process.exit(1); }

  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)).toString('hex');
  console.log(`\nAGREGÁ ESTO A TU .env:\nADMIN_PASSWORD_HASH=${salt}:${hash}\n`);
});

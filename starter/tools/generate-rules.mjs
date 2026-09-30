import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('invitation.json', root), 'utf8'));
if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(config.id || '')) {
  throw new Error('Periksa id pada invitation.json. Gunakan huruf kecil, angka, dan tanda hubung.');
}
const template = await readFile(new URL('setup/rules.blocks.template', root), 'utf8');
const blocks = template.replaceAll('__INVITATION_ID__', config.id);
const full = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n${blocks}  }\n}\n`;
await Promise.all([
  writeFile(new URL('setup/rules.blocks.generated.txt', root), blocks),
  writeFile(new URL('setup/firestore.rules.generated.txt', root), full)
]);
console.log(`Aturan untuk ${config.id} dibuat di starter/setup/.`);
console.log('Project baru: pakai firestore.rules.generated.txt.');
console.log('Project Firebase yang sudah dipakai: tambahkan rules.blocks.generated.txt ke rules yang ada.');

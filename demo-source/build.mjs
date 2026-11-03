import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));
const root=path.basename(source)==='demo-source'?path.dirname(source):source;
for (const [entry,output] of [['entry.tsx','demo.js'],['cloud-setup.tsx','cloud-setup.js']]) {
  await build({entryPoints:[path.join(source,entry)],outfile:path.join(root,output),bundle:true,minify:true,format:'iife',target:'es2022',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
}
if(root!==source)await fs.copyFile(path.join(source,'demo.css'),path.join(root,'demo.css'));
console.log('Built shared workspace and owner access page.');

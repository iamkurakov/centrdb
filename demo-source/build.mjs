import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
const req=createRequire(import.meta.resolve('wrangler/package.json'));const {build}=req('esbuild');const root=path.dirname(new URL(import.meta.url).pathname);
await build({entryPoints:[path.join(root,'entry.tsx')],outfile:path.join(root,'demo.js'),bundle:true,minify:true,format:'iife',target:'es2022',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
console.log('Built public demo.');

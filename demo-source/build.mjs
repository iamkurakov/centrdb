import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
let build;try{({build}=await import('esbuild'))}catch{const req=createRequire(import.meta.resolve('wrangler/package.json'));({build}=req('esbuild'));}const root=path.dirname(new URL(import.meta.url).pathname);
await build({entryPoints:[path.join(root,'entry.tsx')],outfile:path.join(root,path.basename(root)==='demo-source'?'../demo.js':'demo.js'),bundle:true,minify:true,format:'iife',target:'es2022',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
if(path.basename(root)==='demo-source')await fs.copyFile(path.join(root,'demo.css'),path.join(root,'../demo.css'));
console.log('Built coded ID workspace.');

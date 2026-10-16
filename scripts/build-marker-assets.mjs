import ts from 'typescript'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
const destinations=JSON.parse(await readFile(new URL('../src/data/destinations.json',import.meta.url),'utf8'))
const source = await readFile(new URL('../src/LandmarkArt.tsx',import.meta.url),'utf8')
const compiled = ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const temp=new URL('./.landmark-compiled.mjs',import.meta.url)
try {
  await writeFile(temp,compiled)
  const {LandmarkPin}=await import(temp.href)
  for(const destination of destinations) {
    const svg=renderToStaticMarkup(createElement(LandmarkPin,{id:destination.id})).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ')
    await writeFile(new URL(`../public/markers/${destination.markerAsset}`,import.meta.url),svg)
  }
} finally { await unlink(temp).catch(()=>{}) }

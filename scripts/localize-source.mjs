import ts from 'typescript';import fs from 'node:fs';
const skip=new Set(['EventsPage.tsx','EventProvider.tsx','InformationPage.tsx','Explore.tsx','ShopPage.tsx','VoucherWallet.tsx']);
for(const filename of fs.readdirSync('src').filter(f=>f.endsWith('.tsx')&&!f.startsWith('Account')&&!skip.has(f))){
 const file='src/'+filename,code=fs.readFileSync(file,'utf8'),source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];let needed=false;
 const catalog=JSON.parse(fs.readFileSync('src/i18n/messages.en.json','utf8'));
 function visit(node){
  if((ts.isStringLiteral(node)||ts.isJsxText(node)||ts.isNoSubstitutionTemplateLiteral(node))&&catalog[node.text.trim().replace(/\s+/g,' ')]){
   const parent=node.parent,vi=node.text.trim().replace(/\s+/g,' ');
   // Explicit bilingual code and structural keys are already authored and must retain their semantics.
   if(ts.isCallExpression(parent)&&['t','translate'].includes(parent.expression.getText(source)))return;
   if(ts.isLiteralTypeNode(parent)||ts.isPropertyAssignment(parent)&&parent.name===node||ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)||vi==='XÓA TÀI KHOẢN')return;
   let replacement=`t(${JSON.stringify(vi)})`;
   if(ts.isJsxText(node)){const leading=/^\s/.test(node.text)?' ':'';const trailing=/\s$/.test(node.text)?' ':'';replacement=`{${leading?JSON.stringify(leading)+' + ':''}${replacement}${trailing?' + '+JSON.stringify(trailing):''}}`}
   else if(ts.isJsxAttribute(parent))replacement=`{${replacement}}`;
   edits.push({start:node.getStart(source),end:node.end,text:replacement});needed=true;return;
  }
  ts.forEachChild(node,visit)
 }visit(source);
 if(!needed)continue;
 // Static source lists are read through locale-aware accessors, not evaluated in only the startup language.
 for(const statement of source.statements){if(ts.isVariableStatement(statement)){for(const declaration of statement.declarationList.declarations){const init=declaration.initializer;if(init&&(ts.isArrayLiteralExpression(init)||ts.isObjectLiteralExpression(init))&&/[À-ỹĐđ]/.test(init.getText(source))){edits.push({start:init.getStart(source),end:init.getStart(source),text:'localized('},{start:init.end,end:init.end,text:')'});needed='localized'}}}}
 let result=code;for(const edit of edits.sort((a,b)=>b.start-a.start||b.end-a.end))result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
 // Existing explicit useLocale t is reused; otherwise import the pure source translator.
 const imports=needed==='localized'?"import { localized } from './i18n/locale'\n":'';
 if(!/\b(?:const|let)\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useLocale/.test(code)&&!code.includes("import { t")&&!code.includes("import {t"))result="import { t } from './i18n/locale'\n"+result;
 fs.writeFileSync(file,imports+result);console.log(file,edits.length)
}

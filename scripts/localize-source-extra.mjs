import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';
const skip=new Set(['EventProvider.tsx','InformationPage.tsx','Explore.tsx','ShopPage.tsx','VoucherWallet.tsx','PlayerInformation.tsx']);
const catalog=JSON.parse(fs.readFileSync('src/i18n/messages.en.json','utf8'));
const walkFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walkFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);
for(const file of walkFiles('src').filter(f=>/\.(ts|tsx)$/.test(f)&&!f.includes('i18n')&&!path.basename(f).startsWith('Account')&&!skip.has(path.basename(f)))){
 const code=fs.readFileSync(file,'utf8'),source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[],needed=new Set();
 const norm=v=>v.trim().replace(/\s+/g,' ');
 function visit(node){
  const parent=node.parent;
  if(ts.isCallExpression(node)&&['t','interpolate','localized'].includes(node.expression.getText(source)))return;
  if(ts.isTemplateExpression(node)){
   const key=norm(node.head.text+node.templateSpans.map((span,i)=>'${'+i+'}'+span.literal.text).join(''));
   if(catalog[key]){edits.push({start:node.getStart(source),end:node.end,text:`interpolate(${JSON.stringify(key)},[${node.templateSpans.map(span=>span.expression.getText(source)).join(',')}])`});needed.add('interpolate');return}
  }
  if((ts.isStringLiteral(node)||ts.isJsxText(node)||ts.isNoSubstitutionTemplateLiteral(node))&&catalog[norm(node.text)]&&/[À-ỹĐđ]/.test(node.text)){
   const vi=norm(node.text);
   if(ts.isLiteralTypeNode(parent)||ts.isPropertyAssignment(parent)&&parent.name===node||ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)||['XÓA TÀI KHOẢN','XÓA ẢNH CŨ'].includes(vi))return;
   let replacement=`t(${JSON.stringify(vi)})`;
   if(ts.isJsxText(node)){const leading=/^\s/.test(node.text)?' ':'';const trailing=/\s$/.test(node.text)?' ':'';replacement=`{${leading?JSON.stringify(leading)+' + ':''}${replacement}${trailing?' + '+JSON.stringify(trailing):''}}`}
   else if(ts.isJsxAttribute(parent))replacement=`{${replacement}}`;
   edits.push({start:node.getStart(source),end:node.end,text:replacement});needed.add('t');return;
  }
  // Error and status values remain reactive after they have been stored in state.
  if(ts.isJsxExpression(node)&&node.expression&&ts.isIdentifier(node.expression)&&/^(error|notice|.*Error)$/.test(node.expression.text)){edits.push({start:node.expression.getStart(source),end:node.expression.end,text:`t(${node.expression.text})`});needed.add('t');return}
  ts.forEachChild(node,visit)
 }visit(source);
 if(!edits.length)continue;
 for(const statement of source.statements){if(ts.isVariableStatement(statement)){for(const declaration of statement.declarationList.declarations){const init=declaration.initializer;if(init&&(ts.isArrayLiteralExpression(init)||ts.isObjectLiteralExpression(init))&&/[À-ỹĐđ]/.test(init.getText(source))){edits.push({start:init.getStart(source),end:init.getStart(source),text:'localized('},{start:init.end,end:init.end,text:')'});needed.add('localized')}}}}
 let result=code;for(const edit of edits.sort((a,b)=>b.start-a.start||b.end-a.end))result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
 const bound=new Set;function bindings(n){if(ts.isImportSpecifier(n))bound.add(n.name.text);if(ts.isBindingElement(n))bound.add(n.name.getText(source));if(ts.isParameter(n))bound.add(n.name.getText(source));ts.forEachChild(n,bindings)}bindings(source);
 const imports=[...needed].filter(name=>!bound.has(name));if(imports.length){let relative=path.relative(path.dirname(file),'src/i18n/locale').replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;result=`import { ${imports.join(', ')} } from '${relative}'\n`+result}
 fs.writeFileSync(file,result);console.log(file,edits.length)
}

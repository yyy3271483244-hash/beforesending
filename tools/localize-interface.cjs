const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const b = require('@babel/types');
const root = path.resolve(__dirname, '..');
const files = ['HomeScrollStage','WelcomeLetter','FoldedLetterChoices','CompanionChoice','AnimalMedia','AdministratorSystem','ArchiveRooms','LivingLetter','ThreadTail','PaperTurner','PostOfficeChoices','EnvelopeEntrances','DeliveryWorktable','ReadingFlow','ThreadAnimal'];
const keys = new Set();
const chinese = value => /\p{Script=Han}/u.test(value);

for (const name of files) {
  const file = path.join(root, 'src/components', `${name}.jsx`);
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, {sourceType:'module', plugins:['jsx']});
  const owners = new Set();
  function owner(p) {
    return p.findParent(node => node.isFunctionDeclaration() && /^[A-Z]/.test(node.node.id?.name || ''));
  }
  function call(key, expressions = []) {
    keys.add(key);
    return b.callExpression(b.identifier('t'), [b.stringLiteral(key), ...expressions]);
  }
  traverse(ast, {
    JSXText(p) {
      const key = p.node.value.replace(/\s+/g,' ').trim();
      if (!chinese(key)) return;
      const component = owner(p); if (!component) return;
      owners.add(component.node);
      p.replaceWith(b.jsxExpressionContainer(call(key))); p.skip();
    },
    TemplateLiteral: {exit(p) {
      if (!p.node.quasis.some(q => chinese(q.value.cooked || ''))) return;
      if (p.parentPath.isTaggedTemplateExpression()) return;
      const component = owner(p); if (!component) return;
      const key = p.node.quasis.map((q,i) => (q.value.cooked || '') + (i < p.node.expressions.length ? `{${i}}` : '')).join('');
      owners.add(component.node);
      p.replaceWith(call(key,p.node.expressions)); p.skip();
    }},
    StringLiteral(p) {
      if (!chinese(p.node.value)) return;
      const component = owner(p); if (!component) { keys.add(p.node.value); return; }
      if (p.parentPath.isObjectProperty() && p.key === 'key' || p.parentPath.isImportDeclaration()) return;
      if (p.parentPath.isCallExpression() && p.parent.callee.name === 't') { keys.add(p.node.value); return; }
      owners.add(component.node);
      const replacement = call(p.node.value);
      if (p.parentPath.isJSXAttribute()) p.replaceWith(b.jsxExpressionContainer(replacement));
      else p.replaceWith(replacement);
      p.skip();
    },
  });
  for (const node of owners) {
    if (node.body.body.some(s => b.isVariableDeclaration(s) && s.declarations.some(d => b.isCallExpression(d.init) && d.init.callee.name === 'useI18n'))) continue;
    node.body.body.unshift(b.variableDeclaration('const', [b.variableDeclarator(
      b.objectPattern(['t','locale'].map(name => b.objectProperty(b.identifier(name),b.identifier(name),false,true))),
      b.callExpression(b.identifier('useI18n'), []))]));
  }
  if (owners.size && !ast.program.body.some(s=>b.isImportDeclaration(s)&&s.source.value==='../i18n/Language')) {
    ast.program.body.unshift(b.importDeclaration([b.importSpecifier(b.identifier('useI18n'),b.identifier('useI18n'))],b.stringLiteral('../i18n/Language')));
  }
  if (process.argv.includes('--write')) fs.writeFileSync(file,generate(ast,{retainLines:true,jsescOption:{minimal:true}}).code+'\n');
}
fs.writeFileSync(path.join(root,'ui-preview/interface-message-keys.json'),JSON.stringify([...keys].sort(),null,2));
console.log([...keys].sort().join('\n'));

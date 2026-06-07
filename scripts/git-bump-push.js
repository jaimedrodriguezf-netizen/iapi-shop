const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Get commit message from arguments
const commitMsg = process.argv.slice(2).join(' ');
if (!commitMsg) {
  console.error('Error: Por favor, proporciona un mensaje de commit. Ejemplo: npm run bump-push "tu mensaje de commit"');
  process.exit(1);
}

try {
  // 2. Bump version using npm (updates package.json and package-lock.json)
  console.log('Incrementando la versión (patch)...');
  execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });

  // 3. Read the new version from package.json
  const pkgPath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const newVersion = pkg.version;
  console.log(`Nueva versión establecida: v${newVersion}`);

  // 4. Git add all changes
  console.log('Agregando archivos al staging de git...');
  execSync('git add .', { stdio: 'inherit' });

  // 5. Git commit with version prefix
  const finalMsg = `v${newVersion}: ${commitMsg}`;
  console.log(`Confirmando commit con el mensaje: "${finalMsg}"...`);
  execSync(`git commit -m "${finalMsg}"`, { stdio: 'inherit' });

  // 6. Push to github
  console.log('Subiendo cambios a GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log(`\n¡Proceso completado! Versión v${newVersion} subida a GitHub.`);
} catch (error) {
  console.error('\nOcurrió un error durante el proceso:', error.message);
  process.exit(1);
}

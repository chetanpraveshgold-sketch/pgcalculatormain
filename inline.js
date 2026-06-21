const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// Replace stylesheet link with inline style
index = index.replace(/<link[^>]*href="(?:\.\/)?styles\.css"[^>]*>/, `<style>\n${css}\n</style>`);

// Replace app.js script tag with inline script
index = index.replace(/<script[^>]*src="app\.js"[^>]*><\/script>/, `<script>\n${js}\n</script>`);

fs.writeFileSync('index.html', index);
console.log('Successfully updated inlined CSS and unobfuscated JS in index.html');

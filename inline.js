const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// Replace stylesheet link or existing style block with inline style
index = index.replace(/<style>[\s\S]*?<\/style>|<link[^>]*href="(?:\.\/)?styles\.css"[^>]*>/, `<style>\n${css}\n</style>`);

// Replace app.js script tag or existing inline script with new inline script
index = index.replace(/<script[^>]*src="app\.js"[^>]*><\/script>|<script>\s*const MAKING_RANGES[\s\S]*?<\/script>/, `<script>\n${js}\n</script>`);

fs.writeFileSync('index.html', index);
console.log('Successfully updated inlined CSS and unobfuscated JS in index.html');

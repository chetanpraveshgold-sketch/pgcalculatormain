const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// Replace style tag contents
index = index.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${css}\n</style>`);

// Replace script tag contents at the bottom (excluding Alpine)
// There might be multiple script tags. Let's find the one at the end before </body>
index = index.replace(/<script>[^<]*<\/script>\n<\/body>/, `<script>\n${js}\n</script>\n</body>`);

fs.writeFileSync('index.html', index);
console.log('Successfully updated inlined CSS and unobfuscated JS in index.html');

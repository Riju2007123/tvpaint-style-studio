/* tiny static server for testing my-version locally */
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.join(root, path.normalize(p).replace(/^(\.\.[\/\\])+/, ""));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    // the prototype is edited constantly: never let the browser keep an old
    // engine.js / ui.js (the script tags get the file time as a version)
    if (path.basename(file) === "index.html") {
      const v = Date.now().toString(36);
      data = Buffer.from(String(data).replace(/(src=")(engine\.js|ui\.js)(")/g,
        (m, a, f, c) => `${a}${f}?v=${v}${c}`));
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      // never cache during development: the prototype is edited constantly
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache"
    });
    res.end(data);
  });
}).listen(8471, () => console.log("serving my-version at http://localhost:8471"));

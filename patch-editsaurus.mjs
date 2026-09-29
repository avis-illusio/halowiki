import fs from 'fs';
import path from 'path';

const file = path.join('node_modules', 'editsaurus', 'dist', 'cli.js');
let src = fs.readFileSync(file, 'utf8');

const OLD = `      if (req.url.includes("editsaurus")) {
        let content;
        if (isBuilt) {
          const url = \`https://editsaurus-614d2.web.app/editor/\${req.url}\`;
          const response = await fetch(url);
          content = await response.text();
        } else {
          const pathToFile = path2.join(__dirname, "..", "..", "..", "dist", req.url);
          content = fs5.readFileSync(pathToFile, "utf8");
        }
        res.writeHead(200, {
          "Content-Type": req.url.includes(".js") ? "application/javascript" : "text/css",
          "Cache-Control": "public, max-age=60"
        });
        res.end(content);
        return;
      }`;

const NEW = `      if (req.url.includes("editsaurus")) {
        let content;
        const urlPath = req.url.split("?")[0];
        const cacheDir = path2.join(process.cwd(), ".editsaurus-cache");
        const cacheFile = path2.join(cacheDir, urlPath.replace(/^\\/+/, ""));
        if (fs5.existsSync(cacheFile)) {
          content = fs5.readFileSync(cacheFile, "utf8");
          console.log("[editsaurus] cache hit:", urlPath);
        } else if (isBuilt) {
          console.log("[editsaurus] downloading:", urlPath);
          const url = \`https://editsaurus-614d2.web.app/editor/\${req.url}\`;
          try {
            const response = await fetch(url);
            if (!response.ok) {
              console.error("[editsaurus] download failed:", response.status);
              res.writeHead(502);
              res.end();
              return;
            }
            content = await response.text();
            fs5.mkdirSync(path2.dirname(cacheFile), { recursive: true });
            fs5.writeFileSync(cacheFile, content);
            console.log("[editsaurus] cached to:", cacheFile);
          } catch (err) {
            console.error("[editsaurus] fetch error:", err.message);
            res.writeHead(502);
            res.end();
            return;
          }
        } else {
          const pathToFile = path2.join(__dirname, "..", "..", "..", "dist", req.url);
          content = fs5.readFileSync(pathToFile, "utf8");
        }
        res.writeHead(200, {
          "Content-Type": req.url.includes(".js") ? "application/javascript" : "text/css",
          "Cache-Control": "public, max-age=60"
        });
        res.end(content);
        return;
      }`;

if (!src.includes(OLD)) {
  console.error('未找到目标代码，可能已经被 patch 过或版本不同');
  process.exit(1);
}

src = src.replace(OLD, NEW);

// /user 走 try/catch，云端失败也不崩
const USER_OLD = `} else if (["/user"].includes(req.url)) {
          return res.status(200).send(await fetchServer(req.url, req.body));
        }`;
const USER_NEW = `} else if (["/user"].includes(req.url)) {
          try {
            const r = await fetchServer(req.url, req.body);
            return res.status(200).send(r ?? {});
          } catch {
            return res.status(200).send({});
          }
        }`;

if (src.includes(USER_OLD)) {
  src = src.replace(USER_OLD, USER_NEW);
  console.log('已 patch /user');
} else {
  console.warn('未找到 /user 段，跳过');
}

fs.writeFileSync(file, src);
console.log('已 patch 编辑器 UI 加载逻辑');

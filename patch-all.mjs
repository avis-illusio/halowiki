import fs from 'fs';

const file = 'node_modules/editsaurus/dist/cli.js';
let s = fs.readFileSync(file, 'utf8');

// --- Patch 1: 缓存 UI 加载 ---
const OLD1 = `      if (req.url.includes("editsaurus")) {
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
const NEW1 = `      if (req.url.includes("editsaurus")) {
        let content;
        const urlPath = req.url.split("?")[0];
        const cacheDir = path2.join(process.cwd(), ".editsaurus-cache");
        const cacheFile = path2.join(cacheDir, urlPath.replace(/^\\/+/, ""));
        if (fs5.existsSync(cacheFile)) {
          content = fs5.readFileSync(cacheFile, "utf8");
        } else if (isBuilt) {
          const url = \`https://editsaurus-614d2.web.app/editor/\${req.url}\`;
          try {
            const response = await fetch(url);
            if (!response.ok) { res.writeHead(502); res.end(); return; }
            content = await response.text();
            fs5.mkdirSync(path2.dirname(cacheFile), { recursive: true });
            fs5.writeFileSync(cacheFile, content);
          } catch (err) { res.writeHead(502); res.end(); return; }
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

if (s.includes(OLD1)) { s = s.replace(OLD1, NEW1); console.log('P1 完成'); }
else console.log('P1 已存在或未找到');

// --- Patch 2: /user 容错 ---
const OLD2 = `} else if (["/user"].includes(req.url)) {
          return res.status(200).send(await fetchServer(req.url, req.body));
        }`;
const NEW2 = `} else if (["/user"].includes(req.url)) {
          try { return res.status(200).send(await fetchServer(req.url, req.body) ?? {}); }
          catch { return res.status(200).send({}); }
        }`;
if (s.includes(OLD2)) { s = s.replace(OLD2, NEW2); console.log('P2 完成'); }
else console.log('P2 已存在或未找到');

// --- Patch 3: 路径映射 ---
const OLD3 = 'doc.path.replace(rootPath, "/docs")';
const NEW3 = 'doc.path.replace(rootPath, "/docs/")';
if (s.includes(OLD3)) { s = s.replace(OLD3, NEW3); console.log('P3 完成'); }
else console.log('P3 已存在或未找到');

// --- Patch 4: 去尾斜杠 ---
const OLD4 = '        if (doc.path === route) {';
const NEW4 = '        if (doc.path === route || doc.path === route.replace(/\\/$/, "")) {';
if (s.includes(OLD4)) { s = s.replace(OLD4, NEW4); console.log('P4 完成'); }
else console.log('P4 已存在或未找到');

// --- Patch 5: /create /delete 白名单 ---
const OLD5 = '["/info", "/section-info", "/submit", "/undo", "/redo"].includes(req.url)';
const NEW5 = '["/info", "/section-info", "/submit", "/undo", "/redo", "/create", "/delete"].includes(req.url)';
if (s.includes(OLD5)) { s = s.replace(OLD5, NEW5); console.log('P5 完成'); }
else console.log('P5 已存在或未找到');

// --- Patch 6: /create /delete 动作 ---
const OLD6 = `} else if (url.includes("/redo")) {
    return redoAction(body.filePath);
  }
}`;

// 用 base64 避免转义地狱
const CRUD_CODE = `} else if (url.includes("/redo")) {
    return redoAction(body.filePath);
  } else if (url.includes("/create")) {
    return createAction(body);
  } else if (url.includes("/delete")) {
    return deleteAction(body);
  }
}
async function createAction({ path: relPath, title }) {
  if (!relPath) return { success: false, message: "empty path" };
  const safe = relPath.replace(/^[/]+/, "").split("\\\\").join("/");
  if (safe.includes("..")) return { success: false, message: "invalid path" };
  const abs = path3.join(projectCwd, "docs", safe + ".mdx");
  if (fs6.existsSync(abs)) return { success: false, message: "file exists" };
  fs6.mkdirSync(path3.dirname(abs), { recursive: true });
  fs6.writeFileSync(abs, "---\\ntitle: " + (title || safe) + "\\n---\\n\\n");
  return { success: true, payload: { filePath: abs, route: "/halowiki/" + safe } };
}
async function deleteAction({ route }) {
  if (!route) return { success: false, message: "empty route" };
  const abs = detectFileFullPath(projectCwd, route);
  if (!abs) return { success: false, message: "file not found" };
  fs6.unlinkSync(abs);
  return { success: true };
}`;

if (s.includes(OLD6)) { s = s.replace(OLD6, CRUD_CODE); console.log('P6 完成'); }
else console.log('P6 已存在或未找到');

fs.writeFileSync(file, s);
console.log('全部完成');

import fs from 'fs';
const f = 'node_modules/editsaurus/dist/cli.js';
let s = fs.readFileSync(f, 'utf8');

// 1. 扩展中间件白名单
const whiteOld = '["/info", "/section-info", "/submit", "/undo", "/redo"].includes(req.url)';
const whiteNew = '["/info", "/section-info", "/submit", "/undo", "/redo", "/create", "/delete"].includes(req.url)';
if (!s.includes(whiteOld)) { console.error('白名单未找到'); process.exit(1); }
s = s.replace(whiteOld, whiteNew);

// 2. 扩展 callToAction 分支
const callOld = `} else if (url.includes("/redo")) {
    return redoAction(body.filePath);
  }
}`;
const callNew = `} else if (url.includes("/redo")) {
    return redoAction(body.filePath);
  } else if (url.includes("/create")) {
    return createAction(body);
  } else if (url.includes("/delete")) {
    return deleteAction(body);
  }
}
async function createAction({ path: relPath, title }) {
  const fsC = require("fs");
  const pathC = require("path");
  if (!relPath) return { success: false, message: "empty path" };
  const safe = relPath.replace(/^\\.\\/+/, "").replace(/\\/g, "/");
  if (safe.includes("..")) return { success: false, message: "invalid path" };
  const abs = pathC.join(projectCwd, "docs", safe + ".mdx");
  if (fsC.existsSync(abs)) return { success: false, message: "file exists" };
  fsC.mkdirSync(pathC.dirname(abs), { recursive: true });
  const body = "---\\ntitle: " + (title || safe) + "\\n---\\n\\n";
  fsC.writeFileSync(abs, body);
  return { success: true, payload: { filePath: abs, route: "/halowiki/" + safe } };
}
async function deleteAction({ route }) {
  const fsD = require("fs");
  if (!route) return { success: false, message: "empty route" };
  const abs = detectFileFullPath(projectCwd, route);
  if (!abs) return { success: false, message: "file not found" };
  fsD.unlinkSync(abs);
  return { success: true };
}`;
if (!s.includes(callOld)) { console.error('callToAction 未找到'); process.exit(1); }
s = s.replace(callOld, callNew);

fs.writeFileSync(f, s);
console.log('已 patch /create /delete');

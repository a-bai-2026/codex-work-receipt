import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  getProjectIdentitySecret,
  projectDescriptorFromPath,
  projectDescriptorFromSessionMeta,
} from "../src/core/project-identity.mjs";

test("项目身份密钥只在本地生成并可稳定复用", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-work-receipt-project-key-"));
  const first = getProjectIdentitySecret({ dataDir });
  const second = getProjectIdentitySecret({ dataDir });

  assert.equal(first.length, 32);
  assert.deepEqual(second, first);
  assert.equal(fs.existsSync(path.join(dataDir, "project-identity.key")), true);
});

test("Git SSH 与 HTTPS 地址映射为同一匿名项目身份", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-work-receipt-project-"));
  const projectDir = path.join(tempDir, "receipt-project");
  const gitDir = path.join(projectDir, ".git");
  fs.mkdirSync(gitDir, { recursive: true });
  fs.writeFileSync(path.join(gitDir, "config"), `
[remote "origin"]
  url = git@github.com:Example/Receipt-Project.git
`, "utf8");
  const secret = Buffer.alloc(32, 7);

  const fromPath = projectDescriptorFromPath(projectDir, secret);
  const fromSession = projectDescriptorFromSessionMeta({
    cwd: projectDir,
    git: { repository_url: "https://github.com/example/receipt-project.git" },
  }, secret);

  assert.equal(fromPath.projectId, fromSession.projectId);
  assert.equal(fromPath.projectLabel, "Receipt-Project");
  assert.match(fromPath.projectId, /^cwp_[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(fromPath), new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

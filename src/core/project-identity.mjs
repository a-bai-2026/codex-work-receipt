import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { writeFileAtomicSync } from "../lib/files.mjs";

const PROJECT_KEY_FILENAME = "project-identity.key";
const PROJECT_ID_DOMAIN = "codex-work-receipt/project/v1";

function workReceiptHome(requestedDataDir = null) {
  return path.resolve(
    requestedDataDir || process.env.CODEX_WORK_RECEIPT_HOME || path.join(os.homedir(), ".codex-work-receipt"),
  );
}

function normalizeRepositoryUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^git@([^:]+):/i, "$1/")
    .replace(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]+@)?/i, "")
    .replace(/\.git\/?$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function projectLabelFromRepositoryUrl(value) {
  const normalized = String(value || "").trim().replace(/\\/g, "/").replace(/\.git\/?$/i, "");
  const segment = normalized.split(/[/:]/).filter(Boolean).at(-1);
  return segment || null;
}

function normalizeWorkingDirectory(value) {
  const resolved = path.resolve(String(value || "").trim());
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function projectIdForIdentity(identity, secret) {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${PROJECT_ID_DOMAIN}\0${identity}`)
    .digest("hex");
  return `cwp_${digest}`;
}

function gitDirectoryForProject(projectPath) {
  let current = projectPath;
  while (true) {
    const candidate = path.join(current, ".git");
    if (fs.existsSync(candidate)) {
      const stats = fs.statSync(candidate);
      if (stats.isDirectory()) return candidate;
      if (stats.isFile()) {
        const match = /^gitdir:\s*(.+)$/im.exec(fs.readFileSync(candidate, "utf8"));
        if (match) return path.resolve(current, match[1].trim());
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function repositoryUrlFromConfig(gitDirectory) {
  if (!gitDirectory) return null;
  let configPath = path.join(gitDirectory, "config");
  if (!fs.existsSync(configPath)) {
    const commonDirPath = path.join(gitDirectory, "commondir");
    if (fs.existsSync(commonDirPath)) {
      configPath = path.join(path.resolve(gitDirectory, fs.readFileSync(commonDirPath, "utf8").trim()), "config");
    }
  }
  if (!fs.existsSync(configPath)) return null;
  const config = fs.readFileSync(configPath, "utf8");
  const origin = /\[remote\s+"origin"\]([\s\S]*?)(?=\n\s*\[|$)/i.exec(config)?.[1] || "";
  return /^\s*url\s*=\s*(.+)$/im.exec(origin)?.[1]?.trim() || null;
}

export function getProjectIdentitySecret({ dataDir = null } = {}) {
  const directory = workReceiptHome(dataDir);
  const keyPath = path.join(directory, PROJECT_KEY_FILENAME);
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(keyPath)) {
    const value = fs.readFileSync(keyPath, "utf8").trim();
    if (/^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, "hex");
    throw new Error(`项目身份密钥无效：${keyPath}`);
  }

  const secret = crypto.randomBytes(32);
  writeFileAtomicSync(keyPath, `${secret.toString("hex")}\n`);
  try { fs.chmodSync(keyPath, 0o600); } catch {}
  return secret;
}

export function projectDescriptorFromSessionMeta(payload, secret) {
  if (!secret || !payload || typeof payload !== "object") return null;
  const repositoryUrl = typeof payload.git?.repository_url === "string"
    ? payload.git.repository_url
    : null;
  const cwd = typeof payload.cwd === "string" ? payload.cwd : null;
  if (!repositoryUrl && !cwd) return null;

  const identity = repositoryUrl
    ? `repository:${normalizeRepositoryUrl(repositoryUrl)}`
    : `directory:${normalizeWorkingDirectory(cwd)}`;
  const label = repositoryUrl
    ? projectLabelFromRepositoryUrl(repositoryUrl)
    : path.basename(normalizeWorkingDirectory(cwd));
  return {
    projectId: projectIdForIdentity(identity, secret),
    projectLabel: label || "Codex project",
  };
}

export function projectDescriptorFromPath(value, secret) {
  if (!secret) throw new Error("指定项目时缺少本地项目身份密钥");
  const projectPath = normalizeWorkingDirectory(value);
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    throw new Error(`项目目录不存在：${value}`);
  }
  const repositoryUrl = repositoryUrlFromConfig(gitDirectoryForProject(projectPath));
  const identity = repositoryUrl
    ? `repository:${normalizeRepositoryUrl(repositoryUrl)}`
    : `directory:${projectPath}`;
  return {
    projectId: projectIdForIdentity(identity, secret),
    projectLabel: repositoryUrl
      ? projectLabelFromRepositoryUrl(repositoryUrl)
      : path.basename(projectPath),
  };
}

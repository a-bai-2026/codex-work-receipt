import crypto from "node:crypto";
import zlib from "node:zlib";
import QRCode from "qrcode";

import { buildCompensation, getWorkProfileCopy } from "./presentation.mjs";

const MAX_QR_VERSION = 25;
const MAX_MULTIPART_PARTS = 12;

function checksum(value, length = 8) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, length);
}

function compactPresentation(record) {
  const profileId = record.presentation.work_profile;
  const scope = record.source?.scope || (record.presentation.compensation?.label === "本日工资" ? "today" : "latest");
  const mobileProfile = profileId
    ? getWorkProfileCopy(profileId, "zh-CN")
    : { title: record.presentation.work_title, review: record.presentation.review };
  const mobileCompensation = profileId
    ? buildCompensation(scope, record.presentation.compensation?.amount, "zh-CN")
    : record.presentation.compensation;

  return {
    profileId,
    scope,
    mobileProfile,
    mobileCompensation,
  };
}

function compactBase(record) {
  const presentation = compactPresentation(record);
  return {
    v: record.schema_version,
    i: record.id,
    g: record.generated_at,
    o: presentation.scope,
    d: [
      record.period.start_at,
      record.period.end_at,
      record.period.timezone,
      record.period.range_start_date || null,
      record.period.range_end_date || null,
    ],
    s: [
      record.stats.session_count,
      record.stats.completed_turns,
      record.stats.user_messages,
      record.stats.tool_calls,
      record.stats.interruptions,
      record.stats.work_duration_ms,
      record.stats.average_first_token_ms,
    ],
    t: [
      record.stats.tokens.input_tokens,
      record.stats.tokens.cached_input_tokens,
      record.stats.tokens.output_tokens,
      record.stats.tokens.reasoning_output_tokens,
      record.stats.tokens.total_tokens,
    ],
    m: record.stats.models,
    l: record.locale || "zh-CN",
    r: presentation.profileId || null,
    p: [
      record.presentation.default_theme,
      presentation.mobileProfile.title,
      presentation.mobileProfile.review,
      presentation.mobileCompensation
        ? [
            presentation.mobileCompensation.label,
            presentation.mobileCompensation.amount,
            presentation.mobileCompensation.unit,
            presentation.mobileCompensation.note,
            presentation.mobileCompensation.formula_version,
          ]
        : null,
    ],
  };
}

function compactFact(fact) {
  const stats = fact.stats;
  return [
    fact.fact_id,
    fact.session_id,
    fact.identity_quality,
    fact.source_type,
    fact.local_date,
    fact.bucket_start_at,
    fact.bucket_end_at,
    fact.source_watermark_at,
    fact.observed_at,
    [
      fact.source_revision.kind,
      fact.source_revision.row_count,
      fact.source_revision.byte_length,
      fact.source_revision.tail_hash,
    ],
    fact.content_hash,
    [
      stats.completed_turns,
      stats.user_messages,
      stats.tool_calls,
      stats.interruptions,
      stats.work_duration_ms,
      stats.first_token_total_ms,
      stats.first_token_sample_count,
      stats.input_tokens,
      stats.cached_input_tokens,
      stats.output_tokens,
      stats.reasoning_output_tokens,
      stats.total_tokens,
      stats.token_reset_count,
      stats.models,
    ],
  ];
}

export function compactReceipt(record) {
  const compact = compactBase(record);
  if (record.schema_version !== 2) return compact;

  const coverage = record.manifest.coverage;
  return {
    ...compact,
    k: record.source.logical_key,
    h: record.source.snapshot_hash,
    a: [
      record.manifest.version,
      record.manifest.fact_schema_version,
      record.manifest.metric_schema_version,
      record.manifest.accounting_timezone,
      record.manifest.fact_count,
      record.manifest.fact_ids,
      [
        coverage.kind,
        coverage.scan_mode,
        coverage.start_date || null,
        coverage.end_date || null,
        coverage.complete_through_date || null,
        coverage.observed_through_at,
      ],
      record.manifest.manifest_hash,
    ],
    f: record.facts.map(compactFact),
  };
}

function encodeCompact(prefix, compact) {
  const compressed = zlib.deflateRawSync(Buffer.from(JSON.stringify(compact), "utf8"));
  return `${prefix}.${checksum(compressed)}.${compressed.toString("base64url")}`;
}

export function encodeReceiptPayload(record) {
  return encodeCompact(record.schema_version === 2 ? "cwr2" : "cwr1", compactReceipt(record));
}

function qrVersion(payload) {
  return QRCode.create(payload, { errorCorrectionLevel: "M" }).version;
}

function fitsVersion(payload, maxVersion) {
  try {
    return qrVersion(payload) <= maxVersion;
  } catch {
    return false;
  }
}

function multipartPayload(transferId, partIndex, partCount, totalChecksum, chunk) {
  return `cwr2p.${transferId}.${partIndex}.${partCount}.${totalChecksum}.${checksum(chunk)}.${chunk}`;
}

function maxChunkSize(singlePayload, maxVersion) {
  const transferId = checksum(singlePayload, 12);
  const totalChecksum = checksum(singlePayload);
  let low = 32;
  let high = singlePayload.length;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const candidate = multipartPayload(transferId, 12, 12, totalChecksum, singlePayload.slice(0, middle));
    if (fitsVersion(candidate, maxVersion)) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function encodeReceiptPayloads(record, options = {}) {
  const maxVersion = options.maxVersion || MAX_QR_VERSION;
  const maxParts = options.maxParts || MAX_MULTIPART_PARTS;
  const singlePayload = encodeReceiptPayload(record);
  if (fitsVersion(singlePayload, maxVersion)) return [singlePayload];
  if (!singlePayload.startsWith("cwr2.")) {
    throw new Error("旧版小票数据超过单个二维码容量");
  }

  const chunkSize = maxChunkSize(singlePayload, maxVersion);
  const chunks = [];
  for (let offset = 0; offset < singlePayload.length; offset += chunkSize) {
    chunks.push(singlePayload.slice(offset, offset + chunkSize));
  }
  if (chunks.length > maxParts) {
    throw new Error(`小票数据需要 ${chunks.length} 个二维码，超过 ${maxParts} 个上限，请缩小统计范围`);
  }

  const transferId = checksum(singlePayload, 12);
  const totalChecksum = checksum(singlePayload);
  return chunks.map((chunk, index) => (
    multipartPayload(transferId, index + 1, chunks.length, totalChecksum, chunk)
  ));
}

function decodeSinglePayload(payload) {
  const [prefix, expectedChecksum, encoded] = String(payload).split(".");
  if ((prefix !== "cwr1" && prefix !== "cwr2") || !expectedChecksum || !encoded) {
    throw new Error("无效的打工小票二维码");
  }
  const compressed = Buffer.from(encoded, "base64url");
  if (checksum(compressed) !== expectedChecksum) throw new Error("二维码数据校验失败");
  return JSON.parse(zlib.inflateRawSync(compressed).toString("utf8"));
}

export function decodeReceiptPayload(payload) {
  return decodeSinglePayload(payload);
}

export function decodeMultipartReceiptPayloads(payloads) {
  const parts = payloads.map((payload) => {
    const fields = String(payload).split(".");
    const [prefix, transferId, indexText, countText, totalChecksum, partChecksum] = fields;
    const chunk = fields.slice(6).join(".");
    const index = Number(indexText);
    const count = Number(countText);
    if (
      prefix !== "cwr2p" || !transferId || !totalChecksum || !chunk ||
      !Number.isInteger(index) || !Number.isInteger(count) || index < 1 || index > count || count > MAX_MULTIPART_PARTS ||
      checksum(chunk) !== partChecksum
    ) throw new Error("无效的分片二维码");
    return { transferId, index, count, totalChecksum, chunk };
  });
  if (!parts.length) throw new Error("缺少分片二维码");
  const first = parts[0];
  if (parts.some((part) => (
    part.transferId !== first.transferId || part.count !== first.count || part.totalChecksum !== first.totalChecksum
  ))) throw new Error("分片二维码不属于同一张小票");
  const unique = new Map(parts.map((part) => [part.index, part]));
  if (unique.size !== first.count) throw new Error("分片二维码尚未集齐");
  const singlePayload = [...unique.values()].sort((left, right) => left.index - right.index).map((part) => part.chunk).join("");
  if (checksum(singlePayload) !== first.totalChecksum) throw new Error("分片二维码总校验失败");
  return decodeSinglePayload(singlePayload);
}

export function inspectReceiptPayloadPart(payload) {
  const fields = String(payload).split(".");
  const [prefix, transferId, indexText, countText, totalChecksum, partChecksum] = fields;
  const chunk = fields.slice(6).join(".");
  if (prefix !== "cwr2p") return null;
  const index = Number(indexText);
  const count = Number(countText);
  if (!transferId || !chunk || checksum(chunk) !== partChecksum || !Number.isInteger(index) || !Number.isInteger(count)) {
    throw new Error("无效的分片二维码");
  }
  return { transferId, index, count, totalChecksum };
}

import assert from "node:assert/strict";
import test from "node:test";

import { buildCode128B } from "../src/core/barcode.mjs";

test("Code 128 B 会生成带校验位和停止码的真实宽度序列", () => {
  const barcode = buildCode128B("CWR");

  assert.equal(barcode.value, "CWR");
  assert.equal(barcode.checksum, 90);
  assert.equal(barcode.segments.length, 37);
  assert.equal(barcode.totalModules, 68);
  assert.equal(barcode.segments[0].isBar, true);
  assert.equal(barcode.segments.at(-1).isBar, true);
  assert.deepEqual(
    [...new Set(barcode.segments.map((segment) => segment.width))].sort(),
    [1, 2, 3, 4],
  );
});

test("Code 128 B 会把不可编码字符替换为安全占位符", () => {
  assert.equal(buildCode128B("中\nA").value, "??A");
  assert.equal(buildCode128B("").value, "CWR");
});

export function compareSourceRevision(candidate, current) {
  if (!current) return "newer";
  if (!candidate) return "conflict";

  const candidateRows = Number(candidate.row_count ?? candidate.rowCount ?? 0);
  const currentRows = Number(current.row_count ?? current.rowCount ?? 0);
  const candidateBytes = Number(candidate.byte_length ?? candidate.byteLength ?? 0);
  const currentBytes = Number(current.byte_length ?? current.byteLength ?? 0);
  const candidateTail = String(candidate.tail_hash ?? candidate.tailHash ?? "");
  const currentTail = String(current.tail_hash ?? current.tailHash ?? "");

  if (candidateRows === currentRows && candidateBytes === currentBytes) {
    return candidateTail === currentTail ? "same" : "conflict";
  }
  if (candidateRows >= currentRows && candidateBytes >= currentBytes) return "newer";
  return "stale";
}

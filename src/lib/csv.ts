// Utilidad simple para exportar datos a CSV desde el navegador.
const escapeCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: Record<string, unknown>[], headers?: string[]) => {
  if (!rows.length) return '';
  const cols = headers ?? Object.keys(rows[0]);
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => escapeCell(r[c])).join(','))];
  return lines.join('\n');
};

export const downloadCsv = (filename: string, rows: Record<string, unknown>[], headers?: string[]) => {
  const csv = toCsv(rows, headers);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

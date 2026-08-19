const ALLOWED_IMPORTS = new Set(["react", "motion/react", "@lander/kit"]);

const FORBIDDEN = [
  /\beval\s*\(/,
  /\bnew\s+Function\b/,
  /\bfetch\s*\(/,
  /\bdocument\.cookie\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bwindow\.location\b/,
  /\bimport\s*\(/,
];

export function validateSource(source: string): { ok: true } | { ok: false; error: string } {
  if (!source.trim()) return { ok: false, error: "Source cannot be empty." };
  if (source.length > 12_000) return { ok: false, error: "Source is too large to apply." };

  for (const rule of FORBIDDEN) {
    if (rule.test(source)) {
      return { ok: false, error: "That source uses a blocked API." };
    }
  }

  const imports = source.matchAll(/from\s+["']([^"']+)["']/g);
  for (const match of imports) {
    if (!ALLOWED_IMPORTS.has(match[1])) {
      return { ok: false, error: `Import "${match[1]}" is not allowed.` };
    }
  }

  if (!/export\s+default\b/.test(source) && !/export\s+function\b/.test(source)) {
    return { ok: false, error: "Source must export a component." };
  }

  return { ok: true };
}

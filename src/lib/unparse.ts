// Pretty printer that converts an AST back to source code

interface ASTNode {
  tag: string;
  elts: any[];
}

interface LexiconEntry {
  name?: string;
  arity?: number;
}

interface Lexicon {
  [key: string]: LexiconEntry;
}

interface UnparseOptions {
  indentSize?: number;
  compact?: boolean;
}

function unparseNode(node: any, lexicon: Lexicon, indent: number = 0, options: UnparseOptions = {}): string {
  const opts = { indentSize: 2, compact: false, ...options };

  if (!node) return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }

  switch (node.tag) {
  case "PROG":
    if (node.elts && node.elts.length > 0) {
      return unparseNode(node.elts[0], lexicon, indent, opts) + "..";
    }
    return "..";

  case "EXPRS":
    if (!node.elts || node.elts.length === 0) return "";
    if (node.elts.length === 1) return unparseNode(node.elts[0], lexicon, indent, opts);
    return node.elts.map(elt => unparseNode(elt, lexicon, indent, opts)).join("\n");

  case "NUM":
    return node.elts[0];

  case "STR": {
    const str = node.elts[0];
    const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  case "BOOL":
    return node.elts[0] ? "true" : "false";

  case "NULL":
    return "null";

  case "IDENT":
    return node.elts[0];

  case "LIST": {
    if (!node.elts || node.elts.length === 0) return "[]";
    if (opts.compact) {
      return "[" + node.elts.map(elt => unparseNode(elt, lexicon, indent, opts)).join(", ") + "]";
    }
    const innerIndent = indent + opts.indentSize;
    const indentStr = " ".repeat(innerIndent);
    const items = node.elts.map(elt => indentStr + unparseNode(elt, lexicon, innerIndent, opts));
    return "[\n" + items.join("\n") + "\n" + " ".repeat(indent) + "]";
  }

  case "RECORD": {
    if (!node.elts || node.elts.length === 0) return "{}";
    if (opts.compact) {
      return "{" + node.elts.map(elt => unparseNode(elt, lexicon, indent, opts)).join(", ") + "}";
    }
    const innerIndent = indent + opts.indentSize;
    const indentStr = " ".repeat(innerIndent);
    const bindings = node.elts.map(elt => indentStr + unparseNode(elt, lexicon, innerIndent, opts));
    return "{\n" + bindings.join("\n") + "\n" + " ".repeat(indent) + "}";
  }

  case "BINDING": {
    if (node.elts && node.elts.length >= 2) {
      let key = node.elts[0]?.tag === "STR" ? node.elts[0].elts[0] : unparseNode(node.elts[0], lexicon, indent);
      const value = unparseNode(node.elts[1], lexicon, indent, opts);
      return `${key}: ${value}`;
    }
    return "";
  }

  case "PAREN":
    return node.elts?.length > 0 ? "(" + unparseNode(node.elts[0], lexicon, indent, opts) + ")" : "()";

  case "APPLY":
    if (node.elts && node.elts.length >= 2) {
      return unparseNode(node.elts[0], lexicon, indent, opts) + " " + unparseNode(node.elts[1], lexicon, indent, opts);
    }
    return "";

  case "LAMBDA":
    if (node.elts && node.elts.length >= 3) {
      const params = node.elts[1];
      let paramStr = params?.elts ? params.elts.map(p => unparseNode(p, lexicon, indent, opts)).join(" ") : "";
      const bodyStr = unparseNode(node.elts[2], lexicon, indent, opts);
      return paramStr ? `\\${paramStr} . ${bodyStr}` : `\\. ${bodyStr}`;
    }
    return "";

  case "NEG":
    return node.elts?.length >= 1 ? `-${unparseNode(node.elts[0], lexicon, indent, opts)}` : "";

  default: {
    let sourceName = null;
    if (lexicon) {
      for (const [key, value] of Object.entries(lexicon)) {
        if (value && value.name === node.tag) {
          sourceName = key;
          break;
        }
      }
    }
    if (sourceName) {
      if (node.elts && node.elts.length > 0) {
        return `${sourceName} ${node.elts.map(elt => unparseNode(elt, lexicon, indent, opts)).join(" ")}`;
      }
      return sourceName;
    }
    if (node.elts && node.elts.length === 0) return node.tag;
    return `/* ${node.tag} */`;
  }
  }
}

function reconstructNode(pool: any, nodeId: string | number): ASTNode | null {
  if (!nodeId || nodeId === "0" || nodeId === 0) return null;
  const node = pool[nodeId];
  if (!node) return null;

  const result: ASTNode = { tag: node.tag, elts: [] };

  switch (node.tag) {
  case "NUM":
  case "STR":
  case "IDENT":
  case "BOOL":
    result.elts = [node.elts[0]];
    break;
  case "NULL":
    result.elts = [];
    break;
  default:
    if (node.elts && Array.isArray(node.elts)) {
      result.elts = node.elts.map(eltId => {
        if (typeof eltId === "number" || (typeof eltId === "string" && /^\d+$/.test(eltId))) {
          return reconstructNode(pool, eltId);
        }
        return eltId;
      });
    }
    break;
  }
  return result;
}

export function unparse(ast: any, dialectLexicon: Lexicon = {}, options: UnparseOptions = {}): string {
  if (!ast || !ast.root) return "";
  const rootNode = reconstructNode(ast, ast.root);
  return unparseNode(rootNode, dialectLexicon, 0, options);
}

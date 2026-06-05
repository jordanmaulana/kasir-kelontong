// Tiny dependency-free arithmetic evaluator for the fast-mode calculator.
// Supports + - × ÷ with normal precedence. IDR is whole-rupiah money, so the
// final result is rounded to an integer. Returns null when the expression is
// empty, incomplete, malformed, divides by zero, or non-finite.

const OPERATORS = "+-×÷";

type Token = { type: "num"; value: number } | { type: "op"; value: string };

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "×": 2, "÷": 2 };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let num = "";
  for (const ch of expr) {
    if (ch >= "0" && ch <= "9") {
      num += ch;
      continue;
    }
    if (OPERATORS.includes(ch)) {
      if (!num) return null; // operator without a preceding operand
      tokens.push({ type: "num", value: Number(num) });
      num = "";
      tokens.push({ type: "op", value: ch });
      continue;
    }
    return null; // unexpected character
  }
  if (!num) return null; // trailing operator or empty
  tokens.push({ type: "num", value: Number(num) });
  return tokens;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const ops: string[] = [];
  for (const token of tokens) {
    if (token.type === "num") {
      output.push(token);
    } else {
      while (ops.length && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[token.value]) {
        output.push({ type: "op", value: ops.pop() as string });
      }
      ops.push(token.value);
    }
  }
  while (ops.length) output.push({ type: "op", value: ops.pop() as string });
  return output;
}

function evalRpn(rpn: Token[]): number | null {
  const stack: number[] = [];
  for (const token of rpn) {
    if (token.type === "num") {
      stack.push(token.value);
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) return null;
    switch (token.value) {
      case "+":
        stack.push(a + b);
        break;
      case "-":
        stack.push(a - b);
        break;
      case "×":
        stack.push(a * b);
        break;
      case "÷":
        if (b === 0) return null;
        stack.push(a / b);
        break;
      default:
        return null;
    }
  }
  if (stack.length !== 1) return null;
  return stack[0];
}

export function evalExpr(expr: string): number | null {
  const tokens = tokenize(expr);
  if (!tokens) return null;
  const result = evalRpn(toRpn(tokens));
  if (result === null || !Number.isFinite(result)) return null;
  return Math.round(result);
}

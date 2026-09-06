"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> & {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
};

function toInputString(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(value).replace(".", ",");
}

export function parseDecimalText(text: string): number | null {
  let s = text.trim().replace(/\s+/g, "");
  if (!s) return null;

  // Se vírgula e ponto forem usados juntos, o último separador é tratado como decimal.
  // Isso permite colar tanto 1.234,5 quanto 1,234.5 sem quebrar o lançamento.
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    s = s.split(thousandsSeparator).join("");
    if (decimalSeparator === ",") s = s.replace(",", ".");
  } else if (comma >= 0) {
    s = s.replace(",", ".");
  }

  // Evita mais de um separador decimal quando o usuário cola um valor formatado.
  const parts = s.split(".");
  if (parts.length > 2) {
    const decimal = parts.pop();
    s = `${parts.join("")}.${decimal}`;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function DecimalInput({ value, onValueChange, onBlur, onFocus, onKeyDown, ...props }: Props) {
  const [raw, setRaw] = useState(() => toInputString(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setRaw(toInputString(value));
  }, [value]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      data-decimal-input="true"
      value={raw}
      onFocus={(e) => {
        focused.current = true;
        onFocus?.(e);
      }}
      onChange={(e) => {
        // Mantém a vírgula/ponto enquanto a pessoa ainda está digitando.
        // Esse era o problema dos campos controlados diretamente como number.
        const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
        setRaw(cleaned);
        if (cleaned === "") {
          onValueChange(null);
          return;
        }
        const parsed = parseDecimalText(cleaned);
        if (parsed !== null) onValueChange(parsed);
      }}
      onBlur={(e) => {
        focused.current = false;
        const parsed = parseDecimalText(raw);
        if (raw.trim() === "") {
          onValueChange(null);
          setRaw("");
        } else if (parsed !== null) {
          onValueChange(parsed);
          setRaw(toInputString(parsed));
        }
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const fields = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-decimal-input="true"]:not(:disabled)'));
          const current = fields.indexOf(e.currentTarget);
          const next = current >= 0 ? fields[current + 1] : undefined;
          next?.focus();
          next?.select();
        }
        onKeyDown?.(e);
      }}
    />
  );
}

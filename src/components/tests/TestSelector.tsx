"use client";

import { CheckCircle2, FlaskConical, PlusCircle } from "lucide-react";
import { MANDATORY_TESTS, OPTIONAL_TESTS, TEST_CATALOG } from "@/lib/testCatalog";
import type { TestType } from "@/types";

export function TestSelector({ selected, onChange }: { selected: TestType[]; onChange: (tests: TestType[]) => void }) {
  const selectedSet = new Set(selected);
  const toggle = (type: TestType) => onChange(selectedSet.has(type) ? selected.filter((t) => t !== type) : [...selected, type]);
  const renderGroup = (title: string, items: TestType[], tone: "mandatory" | "optional") => (
    <div className="test-selector-group">
      <div className="test-selector-title">
        <span>{tone === "mandatory" ? <CheckCircle2 size={17}/> : <PlusCircle size={17}/>} {title}</span>
        {tone === "mandatory" && <button type="button" className="link-btn" onClick={() => onChange(Array.from(new Set([...selected, ...MANDATORY_TESTS])))}>Selecionar todos</button>}
      </div>
      <div className="test-card-grid">
        {items.map((type) => {
          const item = TEST_CATALOG[type];
          const active = selectedSet.has(type);
          return <button type="button" key={type} onClick={() => toggle(type)} className={`test-card ${active ? "active" : ""}`}>
            <div className="test-card-icon"><FlaskConical size={18}/></div>
            <div className="test-card-copy"><strong>{item.shortLabel}</strong><small>{item.reference}</small><p>{item.description}</p></div>
            <div className={`test-card-check ${active ? "on" : ""}`}>{active ? "✓" : "+"}</div>
          </button>;
        })}
      </div>
    </div>
  );

  return <section className="card test-selector">
    <div className="test-selector-head">
      <div><h3>Ensaios desta amostra</h3><p>Marque somente o que será executado. O formulário e o relatório se adaptam automaticamente.</p></div>
      <div className="badge info">{selected.length} selecionado(s)</div>
    </div>
    {renderGroup("Ensaios obrigatórios da NBR 5564", MANDATORY_TESTS, "mandatory")}
    {renderGroup("Ensaios opcionais / referência", OPTIONAL_TESTS, "optional")}
  </section>;
}

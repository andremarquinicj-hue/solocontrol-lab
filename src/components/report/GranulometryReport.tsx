import { COMPANY } from "@/config/company";
import { TRACK_BANDS } from "@/lib/granulometry";
import type { GranulometryCalculation, GranulometryReportData } from "@/types";
import { GranulometryChart } from "./GranulometryChart";

const f = (n:number|null, decimals=1) => n === null ? "—" : n.toLocaleString("pt-BR",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});

export function GranulometryReport({ data, calculation }: { data: GranulometryReportData; calculation: GranulometryCalculation }) {
  const h=data.header;
  const band=TRACK_BANDS[data.band];
  return (
    <article className="report-a4" id="official-report">
      <img src="/logo-solocontrol.png" className="report-logo" alt="Solocontrol" />

      <table className="report-header-table">
        <tbody>
          <tr><th>Interessado:</th><td colSpan={2}>{h.interested}</td><th>Relatório:</th><td>{h.reportNumber} / Rev. {h.revision || "00"}</td></tr>
          <tr><th>End. contratante:</th><td colSpan={2}>{h.contractorAddress}</td><th>Data:</th><td>{h.completionDate ? new Date(`${h.completionDate}T12:00:00`).toLocaleDateString("pt-BR") : ""}</td></tr>
          <tr><th>Obra:</th><td colSpan={4}>{h.work}</td></tr>
          <tr><th>Procedência/Fornecedor:</th><td colSpan={2}>{h.supplierOrigin}</td><th>Material:</th><td>{h.material}</td></tr>
          <tr><th>Amostra:</th><td>{h.sample}</td><th>Tipo/Designação:</th><td colSpan={2}>{h.sampleType || h.lithology}</td></tr>
        </tbody>
      </table>

      <div className="report-title">ABNT NBR 5564:2021 – Via férrea – Lastro ferroviário de rocha britada – Requisitos e métodos de ensaio</div>
      <div className="report-subtitle">PENEIRAMENTO • {band.label} • Litologia: {h.lithology}</div>

      <table className="report-table">
        <thead>
          <tr>
            <th style={{width:"9%"}}>Peneira</th>
            <th style={{width:"10%"}}>mm</th>
            <th style={{width:"13%"}}>Peso A1 (g)</th>
            <th style={{width:"11%"}}>% Ret. A1</th>
            <th style={{width:"13%"}}>Peso A2 (g)</th>
            <th style={{width:"11%"}}>% Ret. A2</th>
            <th style={{width:"12%"}}>% Passando</th>
            <th style={{width:"11%"}}>Faixa mín.</th>
            <th style={{width:"10%"}}>Faixa máx.</th>
          </tr>
        </thead>
        <tbody>
          {calculation.rows.map((r)=>(
            <tr key={r.mm}>
              <td>{r.label}</td><td>{f(r.mm,1)}</td><td>{f(r.retained1G,1)}</td><td>{f(r.retained1Pct,1)}</td>
              <td>{f(r.retained2G,1)}</td><td>{f(r.retained2Pct,1)}</td><td>{f(r.passingPct,0)}</td>
              <td>{100-r.maxRetainedAccum}</td><td>{100-r.minRetainedAccum}</td>
            </tr>
          ))}
          <tr><td colSpan={2}><strong>Massa inicial</strong></td><td>{f(data.sample1MassG,1)}</td><td>—</td><td>{f(data.sample2MassG,1)}</td><td colSpan={4}>Resultado: <strong>{calculation.overallStatus}</strong></td></tr>
        </tbody>
      </table>

      <div className="report-chart-box">
        <div className="report-chart-title">CURVA GRANULOMÉTRICA</div>
        <GranulometryChart band={data.band} calculation={calculation} />
      </div>

      <div className="report-observations"><strong>Observações:</strong> {h.observations || "Sem observações complementares."}</div>

      <footer className="report-footer">
        <div className="report-footer-top">
          <div className="report-notes">
            <strong>NOTAS:</strong><br/>
            1- {COMPANY.reportNotes[0]}<br/>
            2- {COMPANY.reportNotes[1]}
          </div>
          <div className="report-sign">
            <div className="report-sign-line">
              RESPONSÁVEL PELO ENSAIO<br/>
              <strong>{h.responsibleTechnician}</strong><br/>
              Assinatura
            </div>
          </div>
          <div className="report-sign">
            <img src="/logo-solocontrol.png" alt="Solocontrol" />
            <div className="report-sign-line">
              RESPONSÁVEL TÉCNICO<br/>
              <strong>{h.technicalManager}</strong><br/>
              CREA: {h.crea}
            </div>
          </div>
        </div>
        <div className="report-company">
          <strong>{COMPANY.tradeName}</strong><br/>
          Fone: {COMPANY.phone} – E-mail: {COMPANY.email}<br/>
          {COMPANY.address}
        </div>
        <div className="report-prohibition">{COMPANY.footerNotice}</div>
      </footer>
    </article>
  );
}

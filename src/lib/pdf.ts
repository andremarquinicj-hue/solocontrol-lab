import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function reportElementToPdf(element: HTMLElement) {
  const pages = Array.from(element.querySelectorAll<HTMLElement>(".report-a4"));
  const targets = pages.length ? pages : [element];
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  for (let i = 0; i < targets.length; i++) {
    const canvas = await html2canvas(targets[i], {
      scale: 2.2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      imageTimeout: 15000,
    });
    const img = canvas.toDataURL("image/jpeg", 0.97);
    if (i > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(img, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }
  return pdf;
}

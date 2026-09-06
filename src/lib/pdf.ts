import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function reportElementToPdf(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    scale: 2.4,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    imageTimeout: 15000,
  });

  const img = canvas.toDataURL("image/jpeg", 0.97);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.addImage(img, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  return pdf;
}

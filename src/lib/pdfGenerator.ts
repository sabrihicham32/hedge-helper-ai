import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BloombergTradeData, PRODUCT_TYPE_LABELS } from "@/types/bloomberg";

interface PDFOptions {
  counterparty: string;
  salesName: string;
  salesEmail: string;
  bankName: string;
  date: string;
}

export function generateTradePDF(trade: BloombergTradeData, options: PDFOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald
  const darkColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(options.bankName || "TRADE CONFIRMATION", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${options.date}`, pageWidth - 60, 15);
  doc.text(`Ref: ${Date.now().toString(36).toUpperCase()}`, pageWidth - 60, 22);
  
  // Trade Type Badge
  doc.setFillColor(...darkColor);
  doc.roundedRect(20, 50, 80, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(PRODUCT_TYPE_LABELS[trade.productType], 25, 58);
  
  // Status Badge
  const statusColors: Record<string, [number, number, number]> = {
    done: [16, 185, 129],
    quoted: [59, 130, 246],
    inquiry: [245, 158, 11],
    passed: [239, 68, 68],
  };
  doc.setFillColor(...(statusColors[trade.status] || grayColor));
  doc.roundedRect(105, 50, 40, 12, 2, 2, "F");
  doc.text(trade.status.toUpperCase(), 110, 58);
  
  // Counterparty Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CONTREPARTIE", 20, 78);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.text(options.counterparty || "Non spécifié", 20, 86);
  
  // Trade Details Table
  const tradeDetails: [string, string][] = [];
  
  if (trade.currencyPair) {
    tradeDetails.push(["Paire de devises", trade.currencyPair]);
  }
  if (trade.notional) {
    tradeDetails.push(["Montant nominal", `${trade.notional}${trade.notionalCurrency ? ` ${trade.notionalCurrency}` : ""}`]);
  }
  if (trade.direction) {
    tradeDetails.push(["Direction", trade.direction === "buy" ? "Achat" : "Vente"]);
  }
  if (trade.tenor) {
    tradeDetails.push(["Maturité", trade.tenor]);
  }
  
  // Spot/Forward specific
  if (trade.spotRate) {
    tradeDetails.push(["Taux spot", trade.spotRate]);
  }
  if (trade.forwardPoints) {
    tradeDetails.push(["Points forward", trade.forwardPoints]);
  }
  if (trade.outrightRate && trade.productType === "forward") {
    tradeDetails.push(["Taux outright", trade.outrightRate]);
  }
  
  // Option specific
  if (trade.optionType) {
    tradeDetails.push(["Type d'option", trade.optionType.toUpperCase()]);
  }
  if (trade.strike) {
    tradeDetails.push(["Strike", trade.strike]);
  }
  if (trade.volatility) {
    tradeDetails.push(["Volatilité implicite", trade.volatility]);
  }
  if (trade.premium) {
    tradeDetails.push(["Prime", `${trade.premium}${trade.premiumCurrency ? ` ${trade.premiumCurrency}` : ""}`]);
  }
  if (trade.delta) {
    tradeDetails.push(["Delta", trade.delta]);
  }
  
  if (tradeDetails.length > 0) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAILS DE L'OPÉRATION", 20, 100);
    
    autoTable(doc, {
      startY: 105,
      head: [],
      body: tradeDetails,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: grayColor, cellWidth: 60 },
        1: { textColor: darkColor },
      },
      margin: { left: 20, right: 20 },
    });
  }
  
  // Structure Legs (for complex products)
  if (trade.structureLegs.length > 0) {
    const currentY = (doc as any).lastAutoTable?.finalY || 140;
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("STRUCTURE", 20, currentY + 15);
    
    const legsData = trade.structureLegs.map(leg => [
      leg.direction === "buy" ? "Achat" : "Vente",
      leg.type.toUpperCase(),
      leg.strike,
    ]);
    
    autoTable(doc, {
      startY: currentY + 20,
      head: [["Direction", "Type", "Strike"]],
      body: legsData,
      theme: "striped",
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: 20, right: 20 },
    });
  }
  
  // Footer with Sales info
  const footerY = doc.internal.pageSize.getHeight() - 40;
  
  doc.setDrawColor(...grayColor);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Contact: ${options.salesName}`, 20, footerY + 10);
  doc.text(options.salesEmail, 20, footerY + 16);
  
  doc.setFontSize(8);
  doc.text("Ce document est fourni à titre indicatif et ne constitue pas une confirmation officielle de transaction.", 20, footerY + 26);
  
  // Save
  const filename = `trade_${trade.productType}_${trade.currencyPair?.replace("/", "")}_${Date.now()}.pdf`;
  doc.save(filename);
}

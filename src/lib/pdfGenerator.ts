import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BloombergTradeData, PRODUCT_TYPE_LABELS } from "@/types/bloomberg";
import { SalesSettings } from "@/components/SalesSettingsPanel";

interface PDFOptions {
  counterparty: string;
  settings: SalesSettings;
  date: string;
  tradeRef?: string;
}

export function generateTradePDF(trade: BloombergTradeData, options: PDFOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Professional color palette
  const colors = {
    primary: [15, 23, 42] as [number, number, number],      // Slate 900
    secondary: [30, 41, 59] as [number, number, number],    // Slate 800
    accent: [59, 130, 246] as [number, number, number],     // Blue 500
    accentLight: [96, 165, 250] as [number, number, number], // Blue 400
    success: [16, 185, 129] as [number, number, number],    // Emerald 500
    warning: [245, 158, 11] as [number, number, number],    // Amber 500
    danger: [239, 68, 68] as [number, number, number],      // Red 500
    muted: [100, 116, 139] as [number, number, number],     // Slate 500
    light: [241, 245, 249] as [number, number, number],     // Slate 100
    white: [255, 255, 255] as [number, number, number],
  };

  const tradeRef = options.tradeRef || `TRD-${Date.now().toString(36).toUpperCase()}`;

  // === HEADER SECTION ===
  // Dark gradient header background
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 52, "F");
  
  // Accent line
  doc.setFillColor(...colors.accent);
  doc.rect(0, 52, pageWidth, 2, "F");

  // Logo or Bank Name
  let logoOffset = 20;
  if (options.settings.logoUrl) {
    try {
      doc.addImage(options.settings.logoUrl, "PNG", 15, 10, 35, 35);
      logoOffset = 58;
    } catch (e) {
      console.error("Failed to add logo", e);
    }
  }

  // Bank name in header
  doc.setTextColor(...colors.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const bankName = options.settings.bankName || "TRADE CONFIRMATION";
  doc.text(bankName.toUpperCase(), logoOffset, 22);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.accentLight);
  doc.text("Foreign Exchange & Derivatives Trading Desk", logoOffset, 30);

  // Trade Reference Box
  doc.setFillColor(...colors.secondary);
  doc.roundedRect(pageWidth - 70, 8, 55, 36, 2, 2, "F");
  
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.text("TRADE REFERENCE", pageWidth - 65, 16);
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(tradeRef, pageWidth - 65, 24);
  
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DATE", pageWidth - 65, 32);
  doc.setTextColor(...colors.white);
  doc.setFontSize(9);
  doc.text(options.date, pageWidth - 65, 39);

  // === PRODUCT TYPE BANNER ===
  const statusColors: Record<string, [number, number, number]> = {
    done: colors.success,
    quoted: colors.accent,
    inquiry: colors.warning,
    passed: colors.danger,
  };
  
  const statusLabels: Record<string, string> = {
    done: "EXECUTED",
    quoted: "QUOTED",
    inquiry: "INQUIRY",
    passed: "PENDING",
  };

  let yPos = 62;

  // Product type badge
  doc.setFillColor(...colors.accent);
  doc.roundedRect(15, yPos, 70, 10, 2, 2, "F");
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(PRODUCT_TYPE_LABELS[trade.productType].toUpperCase(), 20, yPos + 7);

  // Status badge
  doc.setFillColor(...(statusColors[trade.status] || colors.muted));
  doc.roundedRect(90, yPos, 35, 10, 2, 2, "F");
  doc.text(statusLabels[trade.status] || trade.status.toUpperCase(), 95, yPos + 7);

  yPos += 20;

  // === PARTIES SECTION ===
  doc.setFillColor(...colors.light);
  doc.roundedRect(15, yPos, pageWidth - 30, 32, 2, 2, "F");

  // Counterparty
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("COUNTERPARTY", 22, yPos + 8);
  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(options.counterparty || "—", 22, yPos + 16);

  // Divider
  doc.setDrawColor(...colors.muted);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2, yPos + 4, pageWidth / 2, yPos + 28);

  // Bank (us)
  doc.setTextColor(...colors.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("EXECUTING BANK", pageWidth / 2 + 10, yPos + 8);
  doc.setTextColor(...colors.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(options.settings.bankName || "—", pageWidth / 2 + 10, yPos + 16);
  
  if (options.settings.bankAddress) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.muted);
    doc.text(options.settings.bankAddress, pageWidth / 2 + 10, yPos + 23);
  }

  yPos += 42;

  // === TRADE ECONOMICS SECTION ===
  doc.setTextColor(...colors.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TRADE ECONOMICS", 15, yPos);
  
  // Underline
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(1);
  doc.line(15, yPos + 2, 65, yPos + 2);

  yPos += 8;

  // Build trade details
  const tradeDetails: [string, string][] = [];
  
  if (trade.currencyPair) tradeDetails.push(["Currency Pair", trade.currencyPair]);
  if (trade.direction) tradeDetails.push(["Direction", trade.direction === "buy" ? "BUY" : "SELL"]);
  if (trade.notional) tradeDetails.push(["Notional Amount", `${trade.notional}${trade.notionalCurrency ? ` ${trade.notionalCurrency}` : ""}`]);
  if (trade.tenor) tradeDetails.push(["Tenor / Maturity", trade.tenor]);
  if (trade.valueDate) tradeDetails.push(["Value Date", trade.valueDate]);
  if (trade.spotRate) tradeDetails.push(["Spot Rate", trade.spotRate]);
  if (trade.forwardPoints) tradeDetails.push(["Forward Points", trade.forwardPoints]);
  if (trade.outrightRate) tradeDetails.push(["Outright Rate", trade.outrightRate]);

  if (tradeDetails.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: tradeDetails,
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 8, right: 8 },
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: colors.muted, cellWidth: 55, halign: "left" },
        1: { textColor: colors.primary, fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: colors.light,
      },
      margin: { left: 15, right: 15 },
    });
    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 50;
  }

  // === OPTIONS SECTION ===
  if (trade.optionType || trade.strike || trade.volatility || trade.premium) {
    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OPTION DETAILS", 15, yPos);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(15, yPos + 2, 55, yPos + 2);

    yPos += 8;

    const optionDetails: [string, string][] = [];
    if (trade.optionType) optionDetails.push(["Option Type", trade.optionType.toUpperCase()]);
    if (trade.strike) optionDetails.push(["Strike Price", trade.strike]);
    if (trade.volatility) optionDetails.push(["Implied Volatility", trade.volatility]);
    if (trade.premium) optionDetails.push(["Premium", `${trade.premium}${trade.premiumCurrency ? ` ${trade.premiumCurrency}` : ""}`]);
    if (trade.delta) optionDetails.push(["Delta", trade.delta]);

    if (optionDetails.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [],
        body: optionDetails,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: { top: 4, bottom: 4, left: 8, right: 8 },
        },
        columnStyles: {
          0: { fontStyle: "bold", textColor: colors.muted, cellWidth: 55 },
          1: { textColor: colors.primary, fontStyle: "bold" },
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        margin: { left: 15, right: 15 },
      });
      yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 40;
    }
  }

  // === STRUCTURE LEGS ===
  if (trade.structureLegs.length > 0) {
    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("STRUCTURE COMPONENTS", 15, yPos);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(15, yPos + 2, 72, yPos + 2);

    yPos += 8;

    const legsData = trade.structureLegs.map((leg, idx) => [
      `Leg ${idx + 1}`,
      leg.direction === "buy" ? "BUY" : "SELL",
      leg.type.toUpperCase(),
      leg.strike,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["", "Direction", "Type", "Strike"]],
      body: legsData,
      theme: "grid",
      headStyles: {
        fillColor: colors.secondary,
        textColor: colors.white,
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: colors.muted },
        1: { fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: colors.light,
      },
      margin: { left: 15, right: 15 },
    });
    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 40;
  }

  // === DISCLAIMER BOX ===
  const disclaimerY = pageHeight - 55;
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.roundedRect(15, disclaimerY, pageWidth - 30, 18, 2, 2, "F");
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.setLineWidth(0.5);
  doc.roundedRect(15, disclaimerY, pageWidth - 30, 18, 2, 2, "S");
  
  doc.setTextColor(146, 64, 14); // Amber 800
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTICE", 20, disclaimerY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  const disclaimer = "This document is provided for informational purposes only and does not constitute an official trade confirmation. " +
    "Final terms are subject to formal documentation. Please verify all details with your relationship manager.";
  doc.text(disclaimer, 20, disclaimerY + 10, { maxWidth: pageWidth - 45 });

  // === FOOTER ===
  const footerY = pageHeight - 32;
  
  // Footer background
  doc.setFillColor(...colors.primary);
  doc.rect(0, footerY, pageWidth, 32, "F");
  
  // Accent line
  doc.setFillColor(...colors.accent);
  doc.rect(0, footerY, pageWidth, 1, "F");

  // Sales contact info
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  
  const salesName = options.settings.salesName || "Sales Desk";
  const salesTitle = options.settings.salesTitle || "";
  doc.text(`${salesName}${salesTitle ? ` | ${salesTitle}` : ""}`, 15, footerY + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...colors.accentLight);
  
  const contactParts = [];
  if (options.settings.salesEmail) contactParts.push(options.settings.salesEmail);
  if (options.settings.salesPhone) contactParts.push(options.settings.salesPhone);
  if (options.settings.bankPhone) contactParts.push(`Desk: ${options.settings.bankPhone}`);
  
  doc.text(contactParts.join("  |  "), 15, footerY + 17);

  // Generated timestamp
  doc.setTextColor(...colors.muted);
  doc.setFontSize(6);
  doc.text(`Generated: ${new Date().toISOString()}`, 15, footerY + 25);
  
  // Page number
  doc.text(`Page 1 of 1`, pageWidth - 30, footerY + 25);

  // Save
  const filename = `${tradeRef}_${trade.currencyPair?.replace("/", "") || "TRADE"}_${options.date.replace(/\//g, "-")}.pdf`;
  doc.save(filename);
}

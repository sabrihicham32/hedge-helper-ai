import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parseBloombergChat } from "@/lib/bloombergParser";
import { generateTradePDF } from "@/lib/pdfGenerator";
import { BloombergTradeData, PRODUCT_TYPE_LABELS } from "@/types/bloomberg";
import { FileText, Sparkles, Download, RefreshCw, Building2, User, Mail, ArrowUpDown, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  done: "bg-green-500/20 text-green-400 border-green-500/30",
  quoted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  inquiry: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  passed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_LABELS = {
  done: "Exécuté",
  quoted: "Coté",
  inquiry: "Demande",
  passed: "En attente",
};

export function SalesTab() {
  const [chatInput, setChatInput] = useState("");
  const [parsedData, setParsedData] = useState<BloombergTradeData | null>(null);
  const [counterparty, setCounterparty] = useState("");
  const [salesName, setSalesName] = useState("");
  const [salesEmail, setSalesEmail] = useState("");
  const [bankName, setBankName] = useState("");

  const handleParse = () => {
    if (!chatInput.trim()) {
      toast.error("Veuillez coller un chat Bloomberg");
      return;
    }
    const data = parseBloombergChat(chatInput);
    setParsedData(data);
    toast.success("Chat analysé avec succès");
  };

  const handleGeneratePDF = () => {
    if (!parsedData) {
      toast.error("Veuillez d'abord analyser un chat");
      return;
    }
    if (!counterparty.trim()) {
      toast.error("Veuillez renseigner la contrepartie");
      return;
    }
    
    generateTradePDF(parsedData, {
      counterparty,
      salesName: salesName || "Sales Desk",
      salesEmail: salesEmail || "sales@bank.com",
      bankName: bankName || "TRADE RECAP",
      date: new Date().toLocaleDateString("fr-FR"),
    });
    
    toast.success("PDF généré avec succès");
  };

  const handleReset = () => {
    setChatInput("");
    setParsedData(null);
    setCounterparty("");
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Bloomberg Chat Parser</h1>
            <p className="text-xs text-muted-foreground">Générez des récapitulatifs PDF à partir de vos chats</p>
          </div>
        </div>

        {/* Input Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Coller le chat Bloomberg
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Collez ici la conversation Bloomberg (Client / Sales)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm bg-secondary/50"
            />
            <div className="flex gap-2">
              <Button onClick={handleParse} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Analyser
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parsed Data Display */}
        {parsedData && (
          <Card className="border-border bg-card animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Données extraites</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                    {PRODUCT_TYPE_LABELS[parsedData.productType]}
                  </Badge>
                  <Badge variant="outline" className={STATUS_COLORS[parsedData.status]}>
                    {STATUS_LABELS[parsedData.status]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {parsedData.currencyPair && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Paire</div>
                    <div className="font-semibold text-primary">{parsedData.currencyPair}</div>
                  </div>
                )}
                {parsedData.notional && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Nominal</div>
                    <div className="font-semibold flex items-center gap-1">
                      <CircleDollarSign className="h-4 w-4 text-accent" />
                      {parsedData.notional} {parsedData.notionalCurrency}
                    </div>
                  </div>
                )}
                {parsedData.direction && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Direction</div>
                    <div className="font-semibold flex items-center gap-1">
                      {parsedData.direction === "buy" ? (
                        <><TrendingUp className="h-4 w-4 text-green-400" /> Achat</>
                      ) : (
                        <><TrendingDown className="h-4 w-4 text-red-400" /> Vente</>
                      )}
                    </div>
                  </div>
                )}
                {parsedData.tenor && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Maturité</div>
                    <div className="font-semibold">{parsedData.tenor}</div>
                  </div>
                )}
                {parsedData.spotRate && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Taux</div>
                    <div className="font-semibold">{parsedData.spotRate}</div>
                  </div>
                )}
                {parsedData.forwardPoints && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-xs text-muted-foreground mb-1">Points Forward</div>
                    <div className="font-semibold">{parsedData.forwardPoints}</div>
                  </div>
                )}
              </div>

              {/* Option Specific */}
              {(parsedData.strike || parsedData.volatility || parsedData.premium) && (
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground mb-2">Détails Option</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {parsedData.optionType && (
                      <div className="p-3 rounded-lg bg-accent/10">
                        <div className="text-xs text-muted-foreground mb-1">Type</div>
                        <div className="font-semibold text-accent">{parsedData.optionType.toUpperCase()}</div>
                      </div>
                    )}
                    {parsedData.strike && (
                      <div className="p-3 rounded-lg bg-accent/10">
                        <div className="text-xs text-muted-foreground mb-1">Strike</div>
                        <div className="font-semibold">{parsedData.strike}</div>
                      </div>
                    )}
                    {parsedData.volatility && (
                      <div className="p-3 rounded-lg bg-accent/10">
                        <div className="text-xs text-muted-foreground mb-1">Volatilité</div>
                        <div className="font-semibold">{parsedData.volatility}</div>
                      </div>
                    )}
                    {parsedData.premium && (
                      <div className="p-3 rounded-lg bg-accent/10">
                        <div className="text-xs text-muted-foreground mb-1">Prime</div>
                        <div className="font-semibold">{parsedData.premium} {parsedData.premiumCurrency}</div>
                      </div>
                    )}
                    {parsedData.delta && (
                      <div className="p-3 rounded-lg bg-accent/10">
                        <div className="text-xs text-muted-foreground mb-1">Delta</div>
                        <div className="font-semibold">{parsedData.delta}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Structure Legs */}
              {parsedData.structureLegs.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground mb-2">Structure</div>
                  <div className="space-y-2">
                    {parsedData.structureLegs.map((leg, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className={leg.direction === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {leg.direction === "buy" ? "Achat" : "Vente"}
                        </Badge>
                        <span className="font-medium">{leg.type.toUpperCase()}</span>
                        <span className="text-muted-foreground">@</span>
                        <span className="font-semibold text-primary">{leg.strike}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PDF Generation Form */}
        {parsedData && (
          <Card className="border-border bg-card animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Générer le PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3 w-3" />
                    Contrepartie (client) *
                  </Label>
                  <Input
                    placeholder="Nom de la banque ou du broker"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3 w-3" />
                    Votre établissement
                  </Label>
                  <Input
                    placeholder="Votre banque"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3" />
                    Nom du Sales
                  </Label>
                  <Input
                    placeholder="Votre nom"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="votre.email@bank.com"
                    value={salesEmail}
                    onChange={(e) => setSalesEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleGeneratePDF} className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

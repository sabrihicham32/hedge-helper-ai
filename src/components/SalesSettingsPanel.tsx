import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Building2, User, Mail, Phone, Image, Save, X } from "lucide-react";
import { toast } from "sonner";

export interface SalesSettings {
  bankName: string;
  bankAddress: string;
  bankPhone: string;
  salesName: string;
  salesEmail: string;
  salesPhone: string;
  salesTitle: string;
  logoUrl: string | null;
}

const DEFAULT_SALES_SETTINGS: SalesSettings = {
  bankName: "",
  bankAddress: "",
  bankPhone: "",
  salesName: "",
  salesEmail: "",
  salesPhone: "",
  salesTitle: "FX Sales",
  logoUrl: null,
};

const STORAGE_KEY = "sales-settings";

export function loadSalesSettings(): SalesSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SALES_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load sales settings", e);
  }
  return DEFAULT_SALES_SETTINGS;
}

export function saveSalesSettings(settings: SalesSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SalesSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SalesSettings) => void;
  currentSettings: SalesSettings;
}

export function SalesSettingsPanel({ isOpen, onClose, onSave, currentSettings }: SalesSettingsPanelProps) {
  const [settings, setSettings] = useState<SalesSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Le logo ne doit pas dépasser 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({ ...prev, logoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    saveSalesSettings(settings);
    onSave(settings);
    toast.success("Paramètres sauvegardés");
    onClose();
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: null }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configuration Sales
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Logo Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Image className="h-4 w-4" />
              Logo de l'établissement
            </Label>
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <div className="relative">
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="h-16 w-auto max-w-[200px] object-contain rounded border border-border bg-white p-2"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Aucun logo</span>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-auto text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG jusqu'à 2MB</p>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Informations de l'établissement
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nom de l'établissement</Label>
                <Input
                  placeholder="BNP Paribas, Société Générale..."
                  value={settings.bankName}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Téléphone</Label>
                <Input
                  placeholder="+33 1 42 98 12 34"
                  value={settings.bankPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankPhone: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs text-muted-foreground">Adresse</Label>
                <Input
                  placeholder="16 Boulevard des Italiens, 75009 Paris"
                  value={settings.bankAddress}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankAddress: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sales Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              Informations du Sales
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nom complet</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={settings.salesName}
                  onChange={(e) => setSettings(prev => ({ ...prev, salesName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Titre / Fonction</Label>
                <Input
                  placeholder="FX Sales, Senior Trader..."
                  value={settings.salesTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, salesTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="jean.dupont@bank.com"
                  value={settings.salesEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, salesEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Téléphone direct</Label>
                <Input
                  placeholder="+33 1 42 98 12 35"
                  value={settings.salesPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, salesPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

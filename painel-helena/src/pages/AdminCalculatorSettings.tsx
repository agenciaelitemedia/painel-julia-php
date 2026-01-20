import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import {
  useAdminCalculatorSettings,
  useUpdateCalculatorSetting,
  CalculatorSetting,
} from "@/hooks/useAdminCalculatorData";
import { toast } from "sonner";

const settingLabels: Record<string, { label: string; description: string; type: string }> = {
  openai_cost_per_1k_input: {
    label: "Custo OpenAI por 1k tokens (input)",
    description: "Custo em USD por 1000 tokens de entrada",
    type: "number",
  },
  openai_cost_per_1k_output: {
    label: "Custo OpenAI por 1k tokens (output)",
    description: "Custo em USD por 1000 tokens de saída",
    type: "number",
  },
  meta_cost_utility: {
    label: "Custo Meta API (Utility)",
    description: "Custo em USD por mensagem utility",
    type: "number",
  },
  meta_cost_marketing: {
    label: "Custo Meta API (Marketing)",
    description: "Custo em USD por mensagem marketing",
    type: "number",
  },
  meta_cost_service: {
    label: "Custo Meta API (Service)",
    description: "Custo em USD por mensagem de serviço",
    type: "number",
  },
  usd_to_brl_rate: {
    label: "Taxa USD → BRL",
    description: "Taxa de conversão do dólar para real",
    type: "number",
  },
  annual_discount_percentage: {
    label: "Desconto Anual (%)",
    description: "Percentual de desconto para pagamento anual",
    type: "number",
  },
  avg_tokens_per_conversation: {
    label: "Média de Tokens por Conversa",
    description: "Estimativa de tokens usados por conversa",
    type: "number",
  },
  avg_messages_per_conversation: {
    label: "Média de Mensagens por Conversa",
    description: "Estimativa de mensagens Meta por conversa",
    type: "number",
  },
  whatsapp_contact_number: {
    label: "WhatsApp de Contato",
    description: "Número para contato comercial (com DDI)",
    type: "text",
  },
  proposal_validity_days: {
    label: "Validade da Proposta (dias)",
    description: "Dias de validade para propostas geradas",
    type: "number",
  },
};

export default function AdminCalculatorSettings() {
  const { data: settings, isLoading } = useAdminCalculatorSettings();
  const updateSetting = useUpdateCalculatorSetting();

  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      const values: Record<string, any> = {};
      settings.forEach((s) => {
        values[s.setting_key] = s.setting_value;
      });
      setEditedValues(values);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      for (const setting of settings) {
        const newValue = editedValues[setting.setting_key];
        if (newValue !== setting.setting_value) {
          await updateSetting.mutateAsync({
            id: setting.id,
            setting_value: newValue,
          });
        }
      }
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const renderSettingInput = (setting: CalculatorSetting) => {
    const config = settingLabels[setting.setting_key] || {
      label: setting.setting_key,
      description: setting.description || "",
      type: "text",
    };

    const value = editedValues[setting.setting_key] ?? setting.setting_value;

    return (
      <div key={setting.id} className="grid gap-2">
        <Label htmlFor={setting.setting_key}>{config.label}</Label>
        <Input
          id={setting.setting_key}
          type={config.type}
          step={config.type === "number" ? "0.0001" : undefined}
          value={value}
          onChange={(e) =>
            handleChange(
              setting.setting_key,
              config.type === "number"
                ? parseFloat(e.target.value) || 0
                : e.target.value
            )
          }
        />
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Configurações da Calculadora
            </h1>
            <p className="text-muted-foreground">
              Configure os parâmetros de cálculo de preços e infraestrutura
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || updateSetting.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateSetting.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        {isLoading ? (
          <Card className="animate-pulse">
            <CardHeader className="h-16 bg-muted" />
            <CardContent className="h-96" />
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Custos OpenAI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  ?.filter((s) => s.setting_key.startsWith("openai_"))
                  .map(renderSettingInput)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Custos Meta API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  ?.filter((s) => s.setting_key.startsWith("meta_"))
                  .map(renderSettingInput)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Conversão e Descontos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  ?.filter((s) =>
                    ["usd_to_brl_rate", "annual_discount_percentage"].includes(
                      s.setting_key
                    )
                  )
                  .map(renderSettingInput)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Estimativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  ?.filter((s) => s.setting_key.startsWith("avg_"))
                  .map(renderSettingInput)}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Outras Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {settings
                  ?.filter(
                    (s) =>
                      !s.setting_key.startsWith("openai_") &&
                      !s.setting_key.startsWith("meta_") &&
                      !s.setting_key.startsWith("avg_") &&
                      !["usd_to_brl_rate", "annual_discount_percentage"].includes(
                        s.setting_key
                      )
                  )
                  .map(renderSettingInput)}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

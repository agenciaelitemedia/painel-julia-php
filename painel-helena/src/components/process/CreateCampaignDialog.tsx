import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProcessCampaigns } from "@/hooks/useProcessCampaigns";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProcessRecord {
  process_number: string;
  phone_number: string;
  process_status: string;
}

export const CreateCampaignDialog = ({ open, onOpenChange }: CreateCampaignDialogProps) => {
  const { toast } = useToast();
  const { createCampaign } = useProcessCampaigns();
  const { instances } = useWhatsAppInstances();
  
  const [name, setName] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [batchSize, setBatchSize] = useState("15");
  const [messageInterval, setMessageInterval] = useState("30000");
  const [batchInterval, setBatchInterval] = useState("60000");
  const [messageTemplate, setMessageTemplate] = useState(
    "Olá! Há uma atualização no processo {numero_processo}:\n\n📋 Status: {andamento}\n\nPara mais informações, entre em contato conosco."
  );
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const connectedInstances = instances?.filter(i => i.status === 'connected') || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedRecords: ProcessRecord[] = jsonData.map((row: any) => ({
        process_number: String(row['numero_processo'] || row['Número do Processo'] || '').trim(),
        phone_number: String(row['telefone'] || row['Telefone'] || '').trim(),
        process_status: String(row['andamento'] || row['Andamento'] || '').trim(),
      }));

      const validRecords = parsedRecords.filter(
        r => r.process_number && r.phone_number && r.process_status
      );

      if (validRecords.length === 0) {
        toast({
          title: "Erro ao processar planilha",
          description: "Nenhum registro válido encontrado. Verifique se as colunas estão corretas.",
          variant: "destructive",
        });
        return;
      }

      if (validRecords.length > 10000) {
        toast({
          title: "Limite excedido",
          description: "A planilha não pode conter mais de 10.000 registros.",
          variant: "destructive",
        });
        return;
      }

      setRecords(validRecords);
      toast({
        title: "Planilha processada",
        description: `${validRecords.length} registros carregados com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao processar planilha",
        description: "Verifique se o arquivo está no formato correto (.xlsx ou .csv)",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a campanha",
        variant: "destructive",
      });
      return;
    }

    if (!instanceId) {
      toast({
        title: "Instância obrigatória",
        description: "Por favor, selecione uma instância WhatsApp",
        variant: "destructive",
      });
      return;
    }

    if (records.length === 0) {
      toast({
        title: "Planilha obrigatória",
        description: "Por favor, faça upload de uma planilha com os dados",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCampaign({
        name: name.trim(),
        whatsapp_instance_id: instanceId,
        scheduled_start_at: scheduledStart || null,
        batch_size: parseInt(batchSize),
        interval_between_messages_ms: parseInt(messageInterval),
        interval_between_batches_ms: parseInt(batchInterval),
        message_template: messageTemplate,
        records,
      });

      onOpenChange(false);
      setName("");
      setInstanceId("");
      setScheduledStart("");
      setBatchSize("15");
      setMessageInterval("30000");
      setBatchInterval("60000");
      setRecords([]);
      setFileName("");
      setMessageTemplate(
        "Olá! Há uma atualização no processo {numero_processo}:\n\n📋 Status: {andamento}\n\nPara mais informações, entre em contato conosco."
      );
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha de Processo</DialogTitle>
          <DialogDescription>
            Configure os dados da campanha e faça upload da planilha com os processos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              placeholder="Ex: Notificação Outubro 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="instance">Instância WhatsApp</Label>
            <Select value={instanceId} onValueChange={setInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma instância" />
              </SelectTrigger>
              <SelectContent>
                {connectedInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.instance_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Planilha de Processos</Label>
            <div className="mt-2">
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
              >
                <div className="flex flex-col items-center justify-center">
                  {fileName ? (
                    <>
                      <FileSpreadsheet className="h-8 w-8 mb-2 text-primary" />
                      <p className="text-sm font-medium">{fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {records.length} registros carregados
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para fazer upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Colunas: numero_processo, telefone, andamento
                      </p>
                    </>
                  )}
                </div>
              </label>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="template">Template da Mensagem</Label>
            <Textarea
              id="template"
              rows={5}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Use {numero_processo} e {andamento} para inserir os dados"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variáveis disponíveis: {"{numero_processo}"}, {"{andamento}"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="batch">Tamanho do Bloco</Label>
              <Input
                id="batch"
                type="number"
                min="1"
                max="50"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="msg-interval">Intervalo Msgs (ms)</Label>
              <Input
                id="msg-interval"
                type="number"
                min="1000"
                step="1000"
                value={messageInterval}
                onChange={(e) => setMessageInterval(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="batch-interval">Intervalo Blocos (ms)</Label>
              <Input
                id="batch-interval"
                type="number"
                min="1000"
                step="1000"
                value={batchInterval}
                onChange={(e) => setBatchInterval(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="scheduled">Agendar Início (Opcional)</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

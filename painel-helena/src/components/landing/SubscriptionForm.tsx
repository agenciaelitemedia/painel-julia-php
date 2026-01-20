import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscriptionRequest } from '@/hooks/useSubscriptionRequest';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, CreditCard, QrCode, Receipt } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BillingCycle } from '@/lib/utils/plan-utils';
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: BillingCycle;
  max_connections: number;
  max_agents: number;
  max_julia_agents: number;
  max_team_members: number;
  max_monthly_contacts: number;
  is_active: boolean;
  is_featured: boolean;
  setup_fee: number | null;
  more_info: string | null;
}
export default function SubscriptionForm() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const {
    loading,
    createRequest,
    verifyCode,
    paymentData
  } = useSubscriptionRequest();
  const [step, setStep] = useState<'plans' | 'form' | 'verify' | 'payment'>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    cpf_cnpj: '',
    email: '',
    whatsapp_phone: ''
  });
  const [phoneData, setPhoneData] = useState({
    ddi: '55',
    phone: '' // DDD + número formatado
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Buscar planos ativos (sem autenticação)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const {
          data,
          error
        } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('display_order', {
          ascending: true
        }).order('name', {
          ascending: true
        });
        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const activePlans = plans.filter(p => p.is_active);
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setStep('form');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Remover formatação e combinar DDI + DDD + Número
    const cleanPhone = phoneData.phone.replace(/\D/g, '');
    const fullPhone = `${phoneData.ddi}${cleanPhone}`;
    const result = await createRequest({
      plan_id: selectedPlanId,
      ...formData,
      whatsapp_phone: fullPhone
    });
    if (result?.success && result.request_id) {
      setRequestId(result.request_id);
      setTrackingUrl(result.tracking_url || '');
      setStep('verify');
    }
  };
  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;
    const result = await verifyCode(requestId, verificationCode);
    if (result.success) {
      setStep('payment');
    }
  };
  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('send-verification-code', {
        body: {
          request_id: requestId,
          verification_code: Math.floor(100000 + Math.random() * 900000).toString(),
          tracking_token: trackingUrl.split('/').pop() || ''
        }
      });
      if (error) throw error;

      // Iniciar cooldown de 60 segundos
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
    } finally {
      setResending(false);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };
  if (plansLoading) {
    return <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (step === 'plans') {
    return <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Conheça as 3 versões da JULIA</h2>
          <p className="text-muted-foreground">Selecione o plano ideal para o seu escritório</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {activePlans.map(plan => <Card key={plan.id} className={`relative hover:shadow-lg transition-all cursor-pointer ${plan.is_featured ? 'border-primary border-2' : ''}`} onClick={() => handlePlanSelect(plan.id)}>
              {plan.is_featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Mais Popular</Badge>
                </div>}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {plan.setup_fee !== null && plan.setup_fee > 0 ? <p className="text-sm text-muted-foreground mt-1">
                      + {formatCurrency(plan.setup_fee)} taxa de implantação
                    </p> : <p className="text-sm text-green-600 mt-1">
                      Implantação Grátis
                    </p>}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{plan.max_connections} conexão(ões) WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{plan.max_agents} assistente(s) IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{plan.max_julia_agents} agente(s) Julia IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{plan.max_team_members} membro(s) da equipe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{plan.max_monthly_contacts} contatos/mês</span>
                  </div>
                </div>

                {plan.more_info && <div className="border-t pt-3">
                    <Button type="button" variant="ghost" size="sm" className="w-full text-xs h-8" onClick={e => {
                e.stopPropagation();
                setExpandedPlan(expandedPlan === plan.id ? null : plan.id);
              }}>
                      {expandedPlan === plan.id ? 'Ocultar informações' : 'Mais informações'}
                    </Button>
                    {expandedPlan === plan.id && <div className="text-xs text-muted-foreground mt-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: plan.more_info
              }} />}
                  </div>}

                <Button className="w-full" variant={plan.is_featured ? 'default' : 'outline'}>
                  Selecionar Plano
                </Button>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (step === 'form') {
    return <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Dados para contratação</CardTitle>
          <CardDescription>
            Plano selecionado: <strong>{selectedPlan?.name}</strong> - {formatCurrency(selectedPlan?.price || 0)}/{selectedPlan?.billing_cycle === 'monthly' ? 'mês' : 'ano'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" required value={formData.full_name} onChange={e => setFormData({
              ...formData,
              full_name: e.target.value
            })} placeholder="Digite seu nome completo" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
              <Input id="cpf_cnpj" required value={formData.cpf_cnpj} onChange={e => setFormData({
              ...formData,
              cpf_cnpj: formatCPFCNPJ(e.target.value)
            })} placeholder="000.000.000-00 ou 00.000.000/0000-00" maxLength={18} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} placeholder="seu@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_phone">WhatsApp</Label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Select value={phoneData.ddi} onValueChange={value => setPhoneData({
                  ...phoneData,
                  ddi: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="DDI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="55">🇧🇷 +55</SelectItem>
                      <SelectItem value="1">🇺🇸 +1</SelectItem>
                      <SelectItem value="351">🇵🇹 +351</SelectItem>
                      <SelectItem value="34">🇪🇸 +34</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Input required value={phoneData.phone} onChange={e => setPhoneData({
                  ...phoneData,
                  phone: formatPhone(e.target.value)
                })} placeholder="(11) 99999-9999" maxLength={15} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviaremos o código de verificação para este número
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep('plans')} className="flex-1">
                Voltar
              </Button>
              <Button type="submit" disabled={loading || phoneData.phone.replace(/\D/g, '').length !== 11} className="flex-1">
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </> : 'Continuar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>;
  }
  if (step === 'verify') {
    return <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Verificação de WhatsApp</CardTitle>
          <CardDescription>
            Enviamos um código de 6 dígitos para o número +{phoneData.ddi} {phoneData.phone}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Label>Digite o código recebido</Label>
            <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Alert>
            <AlertDescription>
              O código expira em 10 minutos. Não compartilhe este código com ninguém.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6} className="w-full">
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </> : 'Verificar código'}
            </Button>

            <div className="text-center">
              <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0 || resending} className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {resending ? <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Reenviando...
                  </span> : resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Não recebeu? Reenviar código'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (step === 'payment' && paymentData) {
    return <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
          <CardDescription>
            Escolha a forma de pagamento para concluir sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Código verificado com sucesso! Complete o pagamento para ativar sua conta.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {paymentData.pix_code && <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    <CardTitle className="text-lg">PIX</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentData.pix_qrcode && <div className="flex justify-center">
                      <img src={paymentData.pix_qrcode} alt="QR Code PIX" className="w-48 h-48" />
                    </div>}
                  <div className="space-y-2">
                    <Label>Código PIX Copia e Cola</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={paymentData.pix_code} className="font-mono text-xs" />
                      <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(paymentData.pix_code || '');
                  }}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Valor: {formatCurrency(paymentData.value || 0)}
                  </p>
                </CardContent>
              </Card>}

            {paymentData.boleto_url && <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    <CardTitle className="text-lg">Boleto</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Valor: {formatCurrency(paymentData.value || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {new Date(paymentData.due_date || '').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => window.open(paymentData.boleto_url, '_blank')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Visualizar Boleto
                  </Button>
                </CardContent>
              </Card>}
          </div>

          <div className="space-y-3">
            {paymentData.invoice_url && (
              <Alert>
                <Receipt className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Visualizar fatura completa:</span>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 font-semibold"
                    onClick={() => window.open(paymentData.invoice_url, '_blank')}
                  >
                    Abrir Fatura
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {trackingUrl && (
              <Alert>
                <AlertDescription>
                  Acompanhe o status do seu pedido em: <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{trackingUrl}</a>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Importante:</strong> Após a confirmação do pagamento, seus dados de acesso serão enviados automaticamente para o WhatsApp cadastrado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  return null;
}
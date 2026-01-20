import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Scale, CheckCircle, Clock, Brain, UserCheck, Shield, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import logoFull from '@/assets/logo-full.png';
import logoIcon from '@/assets/logo-icon.png';
import SubscriptionForm from '@/components/landing/SubscriptionForm';
export default function Landing() {
  const navigate = useNavigate();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messages = [{
    id: 1,
    type: 'client',
    text: 'Olá, preciso de um advogado para uma ação trabalhista',
    time: '14:23'
  }, {
    id: 2,
    type: 'julia',
    text: 'Olá! Sou a Julia, assistente jurídica. Vou te ajudar! Pode me contar mais sobre seu caso?',
    time: '14:23'
  }, {
    id: 3,
    type: 'client',
    text: 'Fui demitido sem justa causa e não recebi as verbas rescisórias',
    time: '14:24'
  }, {
    id: 4,
    type: 'julia',
    text: 'Entendi. Vou fazer algumas perguntas para avaliar seu caso. Quanto tempo você trabalhou na empresa?',
    time: '14:24'
  }, {
    id: 5,
    type: 'client',
    text: 'Trabalhei por 3 anos',
    time: '14:25'
  }, {
    id: 6,
    type: 'julia',
    text: 'Você tem a carteira assinada e documentos comprovando o vínculo empregatício?',
    time: '14:25'
  }, {
    id: 7,
    type: 'client',
    text: 'Sim, tenho tudo documentado',
    time: '14:26'
  }, {
    id: 8,
    type: 'julia',
    text: 'Perfeito! ✅ Analisando seu caso:',
    list: ['• Vínculo empregatício: Confirmado', '• Tempo de serviço: 3 anos', '• Verbas não pagas: Rescisórias', '• Viabilidade: ALTA'],
    time: '14:26'
  }, {
    id: 9,
    type: 'julia',
    text: 'Seu caso tem excelentes chances de êxito! Deseja prosseguir com a contratação dos nossos serviços jurídicos?',
    time: '14:27'
  }, {
    id: 10,
    type: 'client',
    text: 'Sim, quero contratar!',
    time: '14:27'
  }, {
    id: 11,
    type: 'julia',
    text: 'Excelente! 🎉 Preparei seu contrato de prestação de serviços.',
    contract: true,
    time: '14:28'
  }, {
    id: 12,
    type: 'client',
    text: 'Vou assinar agora!',
    time: '14:29'
  }, {
    id: 13,
    type: 'julia',
    text: '⏳ Aguardando assinatura do contrato...',
    time: '14:29'
  }, {
    id: 14,
    type: 'julia',
    text: '✅ Contrato assinado com sucesso!',
    extra: 'Sua ação trabalhista já está em andamento. Nossa equipe entrará em contato em até 24h com os próximos passos.',
    footer: 'Bem-vindo(a) ao nosso escritório! 🎊',
    time: '14:30'
  }];

  // Timings para quando cada mensagem deve aparecer (em segundos)
  const messageTimings = [{
    id: 1,
    delay: 0.5,
    typingBefore: 0
  }, {
    id: 2,
    delay: 2,
    typingBefore: 1
  }, {
    id: 3,
    delay: 3.5,
    typingBefore: 0.8
  }, {
    id: 4,
    delay: 5,
    typingBefore: 1.2
  }, {
    id: 5,
    delay: 6.5,
    typingBefore: 0.7
  }, {
    id: 6,
    delay: 8,
    typingBefore: 1
  }, {
    id: 7,
    delay: 9.5,
    typingBefore: 0.6
  }, {
    id: 8,
    delay: 11,
    typingBefore: 1.5
  }, {
    id: 9,
    delay: 13,
    typingBefore: 1
  }, {
    id: 10,
    delay: 14.5,
    typingBefore: 0.8
  }, {
    id: 11,
    delay: 16,
    typingBefore: 1.2
  }, {
    id: 12,
    delay: 17.5,
    typingBefore: 0.7
  }, {
    id: 13,
    delay: 18.5,
    typingBefore: 0.5
  }, {
    id: 14,
    delay: 20,
    typingBefore: 1.3
  }];
  useEffect(() => {
    // Reset e inicia a animação
    setVisibleMessages([]);
    setIsTyping(false);
    const timeouts: NodeJS.Timeout[] = [];
    messageTimings.forEach(({
      id,
      delay,
      typingBefore
    }) => {
      // Mostrar indicador de digitação
      if (typingBefore > 0) {
        const typingTimeout = setTimeout(() => {
          setIsTyping(true);
        }, (delay - typingBefore) * 1000);
        timeouts.push(typingTimeout);
      }

      // Mostrar mensagem
      const messageTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(prev => [...prev, id]);
      }, delay * 1000);
      timeouts.push(messageTimeout);
    });

    // Reset após 25 segundos
    const resetTimeout = setTimeout(() => {
      setVisibleMessages([]);
      setIsTyping(false);
    }, 25000);
    timeouts.push(resetTimeout);
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Auto-scroll para o fim do chat apenas
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);
  const features = [{
    icon: MessageCircle,
    title: 'Atendimento 24/7',
    description: 'Julia atende seus clientes no WhatsApp a qualquer hora, respondendo dúvidas e coletando informações essenciais.'
  }, {
    icon: UserCheck,
    title: 'Qualificação inteligente',
    description: 'Identifica automaticamente o perfil do cliente e o tipo de caso, direcionando apenas leads qualificados.'
  }, {
    icon: CheckCircle,
    title: 'Fechamento autônomo',
    description: 'Negocia honorários, envia propostas e fecha contratos diretamente pelo WhatsApp, sem intervenção humana.'
  }, {
    icon: Brain,
    title: 'IA Jurídica especializada',
    description: 'Treinada especificamente para advocacia, com conhecimento em legislação e termos técnicos do direito.'
  }, {
    icon: Scale,
    title: 'Triagem de casos',
    description: 'Analisa a viabilidade jurídica, identifica o tipo de ação e prioriza casos com maior potencial.'
  }, {
    icon: Shield,
    title: 'Segurança e conformidade',
    description: 'Dados protegidos com criptografia e total conformidade com LGPD e sigilo profissional.'
  }];
  const benefits = [{
    title: 'Conversões naturais e empáticas',
    description: 'Julia conversa como um SDR experiente, qualificando leads e fechando contratos com naturalidade.'
  }, {
    title: 'Enquanto você descansa, Julia trabalha',
    description: 'Atendimento 24/7 sem pausas. Capture leads fora do horário comercial e nunca perca uma oportunidade.'
  }, {
    title: 'Aumente captação sem aumentar custos',
    description: 'Escale seu escritório sem contratar mais atendentes. Julia atende milhares de clientes simultaneamente.'
  }];
  const testimonials = [{
    name: 'Dr. Carlos Mendes',
    role: 'Advogado Trabalhista',
    text: 'Julia triplicou nossa captação de clientes. Agora atendemos leads 24h e fechamos contratos mesmo de madrugada.'
  }, {
    name: 'Dra. Ana Paula Silva',
    role: 'Escritório de Família',
    text: 'A qualificação automática economiza horas da equipe. Só recebemos clientes realmente interessados e qualificados.'
  }];
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header/Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoFull} alt="Julia - IA para Advocacia" className="h-10 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-sm font-medium hover:text-primary transition-colors">
              Funcionalidades
            </button>
            <button onClick={() => document.getElementById('beneficios')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-sm font-medium hover:text-primary transition-colors">
              Benefícios
            </button>
            <button onClick={() => document.getElementById('depoimentos')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-sm font-medium hover:text-primary transition-colors">
              Depoimentos
            </button>
            <button onClick={() => document.getElementById('contratar')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-sm font-medium hover:text-primary transition-colors">
              Contratar
            </button>
          </nav>
          <Button onClick={() => navigate('/dashboard')} className="shadow-lg">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Inteligência Artificial de Atendimento Jurídico
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                A IA que <span className="text-primary">atende</span>,{' '}
                <span className="text-primary">qualifica</span> e{' '}
                <span className="text-primary">fecha contratos</span> sozinha
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">Julia é a inteligência artificial especializada em advocacia que trabalha 24/7 no WhatsApp do seu escritório, convertendo leads em clientes enquanto você foca no que realmente importa.</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={() => document.getElementById('contratar')?.scrollIntoView({
                behavior: 'smooth'
              })} className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
                  Contratar agora
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8">
                  Agendar demonstração
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Demonstração personalizada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Sem compromisso</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden">
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/20 shadow-2xl w-full h-[600px]">
                <div className="space-y-4">
                  {/* Simulação de chat */}
                  <div className="bg-background rounded-lg shadow-md overflow-hidden flex flex-col max-h-[500px]">
                    {/* Header fixo */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 sticky top-0 z-10">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Cliente</p>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                          Online agora
                        </p>
                      </div>
                    </div>
                    
                    {/* Mensagens com scroll */}
                    <div ref={messagesContainerRef} className="h-[450px] overflow-y-auto p-4">
                      <div className="space-y-3">
                        {messages.map(message => {
                        if (!visibleMessages.includes(message.id)) return null;
                        if (message.type === 'client') {
                          return <div key={message.id} className="bg-muted p-3 rounded-lg max-w-[80%] animate-fade-in">
                                <p className="text-sm">{message.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                              </div>;
                        } else {
                          return <div key={message.id} className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%] ml-auto animate-fade-in">
                                <p className="text-sm">{message.text}</p>
                                {message.list && <ul className="text-sm mt-2 space-y-1">
                                    {message.list.map((item, idx) => <li key={idx}>{item}</li>)}
                                  </ul>}
                                {message.contract && <div className="mt-2 p-2 bg-primary-foreground/10 rounded border border-primary-foreground/20">
                                    <p className="text-xs font-semibold">📄 Contrato - Ação Trabalhista</p>
                                    <span className="text-xs underline break-all">https://app.zapsign.com.br/contrato/abc123xyz</span>
                                  </div>}
                                {message.extra && <p className="text-sm mt-2">{message.extra}</p>}
                                {message.footer && <p className="text-sm mt-2 font-semibold">{message.footer}</p>}
                                <p className="text-xs opacity-80 mt-1">{message.time}</p>
                              </div>;
                        }
                      })}
                        
                        {/* Indicador de digitação */}
                        {isTyping && <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%] ml-auto animate-fade-in">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 bg-primary-foreground rounded-full animate-bounce" style={{
                            animationDelay: '0ms'
                          }}></span>
                              <span className="h-2 w-2 bg-primary-foreground rounded-full animate-bounce" style={{
                            animationDelay: '150ms'
                          }}></span>
                              <span className="h-2 w-2 bg-primary-foreground rounded-full animate-bounce" style={{
                            animationDelay: '300ms'
                          }}></span>
                            </div>
                          </div>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Brain className="h-4 w-4 text-primary" />
                    <span>Julia qualificou e fechou o contrato automaticamente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O problema que está custando dinheiro ao seu escritório</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Hoje, o maior gargalo dos escritórios de advocacia não está na falta de clientes — está na <strong>falta de tempo</strong> para atender, 
              qualificar e acompanhar cada um deles até o fechamento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border shadow-lg text-center">
              <div className="text-5xl font-bold text-primary mb-4">60%</div>
              <h3 className="text-xl font-semibold mb-2">Leads Perdidos</h3>
              <p className="text-muted-foreground">Por falta de resposta imediata</p>
            </div>
            <div className="bg-card p-8 rounded-xl border shadow-lg text-center">
              <div className="text-5xl font-bold text-primary mb-4">45%</div>
              <h3 className="text-xl font-semibold mb-2">Sem Follow-up</h3>
              <p className="text-muted-foreground">Clientes que desistem no meio do processo</p>
            </div>
            <div className="bg-card p-8 rounded-xl border shadow-lg text-center">
              <div className="text-5xl font-bold text-primary mb-4">72%</div>
              <h3 className="text-xl font-semibold mb-2">Tempo Desperdiçado</h3>
              <p className="text-muted-foreground">Em tarefas repetitivas de qualificação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Resultados que transformam seu escritório</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Com a JULIA, o seu escritório deixa de depender de humanos para manter o comercial ativo. 
              Você escolhe o nível de automação — desde uma assistente que atende até uma closer que fecha contratos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-card to-card/50 p-8 rounded-xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Mais Tempo para Advogar</h3>
              <p className="text-muted-foreground">Libere sua equipe das tarefas repetitivas de atendimento e qualificação para focar no que realmente importa: exercer a advocacia com excelência</p>
            </div>
            <div className="bg-gradient-to-br from-card to-card/50 p-8 rounded-xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CheckCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Aumento de Conversão</h3>
              <p className="text-muted-foreground">Resposta imediata e follow-up consistente aumentam drasticamente a taxa de fechamento de contratos</p>
            </div>
            <div className="bg-gradient-to-br from-card to-card/50 p-8 rounded-xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Zero Leads Perdidos</h3>
              <p className="text-muted-foreground">Atendimento 24/7 garante que nenhum cliente em potencial fique sem resposta ou acompanhamento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recursos desenvolvidos para escritórios de advocacia
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Julia entende de direito e sabe exatamente como conduzir uma conversa 
              para transformar interessados em clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <div key={index} className="bg-card p-6 rounded-xl border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Julia Versions Section */}
      

      {/* Testimonials Section */}
      <section id="depoimentos" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que dizem nossos clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Escritórios de advocacia que já transformaram seu atendimento com Julia
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => <div key={index} className="bg-card p-8 rounded-xl border shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section id="contratar" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-background">
        <SubscriptionForm />
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-16 shadow-2xl text-primary-foreground">
          <Sparkles className="h-16 w-16 mx-auto opacity-80" />
          <h2 className="text-3xl md:text-5xl font-bold">
            Dúvidas sobre os planos?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Agende uma demonstração personalizada e veja como Julia pode revolucionar 
            a captação de clientes do seu escritório.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/auth')} variant="secondary" className="text-lg px-8 shadow-xl">
              Agendar demonstração
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 pt-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Configuração em minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Suporte especializado</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="AtendeJulia" className="h-8 w-8" />
              <span className="font-semibold">AtendeJulia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AtendeJulia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
}
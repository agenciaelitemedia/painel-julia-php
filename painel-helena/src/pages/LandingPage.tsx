import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, CheckCircle, Clock, Users, Zap } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Email submitted:", email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Julia, IA que atende, qualifica e fecha contratos sozinha
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Automatize seu atendimento com inteligência artificial que entende, 
            responde e converte clientes 24/7 sem intervenção humana.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="px-8">
              Começar Agora
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Ver Demonstração
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Bot className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Atendimento Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                IA que entende o contexto e responde com naturalidade, 
                simulando um atendente humano.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Qualificação Automática</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identifica leads qualificados e faz perguntas estratégicas 
                para aumentar conversão.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Fechamento Autônomo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Negocia, envia propostas e fecha contratos sem 
                necessidade de supervisão.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
              <CardTitle>Integração Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conecte com seu CRM e sistemas existentes em 
                minutos, sem complexidade.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">Taxa de Resposta</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">3x</div>
              <div className="text-gray-600">Aumento em Vendas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Atendimento Contínuo</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-600 mb-2">5min</div>
              <div className="text-gray-600">Setup Rápido</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para revolucionar seu atendimento?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Junte-se a centenas de empresas que já aumentaram 
            suas vendas com a Julia IA.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary">
              Solicitar Acesso
            </Button>
          </form>
        </div>

        {/* Testimonials Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            O Que Nossos Clientes Dizem
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "A Julia aumentou nossas vendas em 300% no primeiro mês. 
                  O atendimento ficou mais humano e eficiente."
                </p>
                <div className="font-semibold">Maria Silva</div>
                <div className="text-sm text-gray-500">Diretora Comercial, TechCorp</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Reduzimos o tempo de resposta de horas para segundos. 
                  Clientes elogiam a agilidade do atendimento."
                </p>
                <div className="font-semibold">João Santos</div>
                <div className="text-sm text-gray-500">CEO, StartupXYZ</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "A qualificação automática economizou 20h semanais 
                  do nosso time. Foco aumentou em fechamentos."
                </p>
                <div className="font-semibold">Ana Costa</div>
                <div className="text-sm text-gray-500">Gerente, VendasPro</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
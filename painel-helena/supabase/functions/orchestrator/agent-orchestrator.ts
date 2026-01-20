/**
 * Agent Orchestrator - Gerencia loop de tool calling
 */

import { ToolCall, ToolResult, ToolExecutionContext, ToolsConfig } from "../tools/types.ts";
import { ToolExecutor } from "./tool-executor.ts";

interface Message {
  role: string;
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface OrchestrationResult {
  finalResponse: string;
  iterations: number;
  toolsExecuted: number;
  totalTokens: {
    input: number;
    output: number;
  };
}

export class AgentOrchestrator {
  private context: ToolExecutionContext;
  private config: ToolsConfig;
  private toolExecutor: ToolExecutor;
  private maxIterations: number = 5;

  constructor(
    context: ToolExecutionContext,
    config: ToolsConfig,
    maxIterations: number = 5
  ) {
    this.context = context;
    this.config = config;
    this.toolExecutor = new ToolExecutor(context, config);
    this.maxIterations = maxIterations;
  }

  /**
   * Executa o loop de conversação com tools
   */
  async run(
    messages: Message[],
    llmApiKey: string,
    model: string = 'gpt-4o-mini',
    temperature: number = 0.7,
    maxTokens: number = 1000,
    toolDefinitions: any[]
  ): Promise<OrchestrationResult> {
    console.log('🚀 Iniciando Agent Orchestrator');
    console.log(`📊 Configuração: model=${model}, max_iterations=${this.maxIterations}, tools=${toolDefinitions.length}`);

    let currentMessages = [...messages];
    let iterations = 0;
    let toolsExecuted = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (iterations < this.maxIterations) {
      iterations++;
      console.log(`\n🔄 Iteração ${iterations}/${this.maxIterations}`);

      // Chamar LLM
      const response = await this.callLLM(
        currentMessages,
        llmApiKey,
        model,
        temperature,
        maxTokens,
        toolDefinitions
      );

      totalInputTokens += response.usage.prompt_tokens;
      totalOutputTokens += response.usage.completion_tokens;

      const assistantMessage = response.choices[0].message;

      // Verificar se há tool_calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`🛠️ ${assistantMessage.tool_calls.length} tool call(s) detectado(s)`);

        // Adicionar mensagem do assistente com tool_calls
        currentMessages.push({
          role: 'assistant',
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls
        });

        // Executar tools em paralelo
        const toolResults = await this.toolExecutor.executeToolCalls(assistantMessage.tool_calls);
        toolsExecuted += toolResults.length;

        // Adicionar resultados das tools às mensagens
        for (const result of toolResults) {
          currentMessages.push(result as Message);
        }

        console.log(`✅ ${toolResults.length} tool(s) executada(s)`);
      } else {
        // Resposta final (sem tool_calls)
        console.log('✨ Resposta final recebida');
        
        return {
          finalResponse: assistantMessage.content || '',
          iterations,
          toolsExecuted,
          totalTokens: {
            input: totalInputTokens,
            output: totalOutputTokens
          }
        };
      }

      // Proteção contra loop infinito
      if (iterations >= this.maxIterations) {
        console.warn('⚠️ Máximo de iterações atingido');
        return {
          finalResponse: 'Desculpe, não consegui processar sua solicitação completamente. Por favor, tente novamente.',
          iterations,
          toolsExecuted,
          totalTokens: {
            input: totalInputTokens,
            output: totalOutputTokens
          }
        };
      }
    }

    // Fallback (não deveria chegar aqui)
    return {
      finalResponse: 'Erro no processamento',
      iterations,
      toolsExecuted,
      totalTokens: {
        input: totalInputTokens,
        output: totalOutputTokens
      }
    };
  }

  /**
   * Chama a API do LLM
   */
  private async callLLM(
    messages: Message[],
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    tools: any[]
  ): Promise<any> {
    const payload: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    // Adicionar tools se houver
    if (tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    console.log(`📡 Chamando LLM: ${model}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro LLM:', errorText);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}

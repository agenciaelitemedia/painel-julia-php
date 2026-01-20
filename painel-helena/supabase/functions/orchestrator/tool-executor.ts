/**
 * Tool Executor - Executa funções de tools
 */

import { ToolCall, ToolResult, ToolExecutionContext, ToolsConfig } from "../tools/types.ts";
import { BookingTool } from "../tools/booking-tool.ts";

export class ToolExecutor {
  private context: ToolExecutionContext;
  private config: ToolsConfig;

  constructor(context: ToolExecutionContext, config: ToolsConfig) {
    this.context = context;
    this.config = config;
  }

  /**
   * Executa uma lista de tool calls em paralelo
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    console.log(`⚡ Executando ${toolCalls.length} tool call(s)...`);

    const results = await Promise.all(
      toolCalls.map(toolCall => this.executeToolCall(toolCall))
    );

    return results;
  }

  /**
   * Executa um único tool call
   */
  private async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    const startTime = Date.now();

    console.log(`🔧 Tool: ${functionName}`, args);

    let result: string;
    let success = true;
    let errorMessage: string | null = null;

    try {
      // Identificar qual tool deve executar a função
      if (this.isBookingFunction(functionName)) {
        const bookingTool = new BookingTool(this.context, this.config.booking!);
        result = await bookingTool.execute(functionName, args);
      } else {
        result = JSON.stringify({ 
          error: `Função desconhecida: ${functionName}` 
        });
        success = false;
        errorMessage = `Função desconhecida: ${functionName}`;
      }
    } catch (error) {
      console.error(`❌ Erro ao executar ${functionName}:`, error);
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      result = JSON.stringify({ 
        error: errorMessage
      });
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Resultado de ${functionName}:`, result.substring(0, 100));

    // Registrar invocação no banco de dados
    await this.logToolInvocation(
      functionName,
      args,
      result,
      success,
      errorMessage,
      executionTime
    );

    return {
      tool_call_id: toolCall.id,
      role: "tool",
      name: functionName,
      content: result
    };
  }

  /**
   * Registra a invocação da tool no banco para auditoria
   */
  private async logToolInvocation(
    functionName: string,
    args: any,
    result: string,
    success: boolean,
    errorMessage: string | null,
    executionTimeMs: number
  ): Promise<void> {
    try {
      const { supabase, agent_id, client_id, conversation_id, remote_jid } = this.context;

      // Truncar argumentos e resultados longos para economizar espaço
      const truncatedArgs = JSON.stringify(args).substring(0, 1000);
      const truncatedResult = result.substring(0, 2000);

      await supabase
        .from('agent_tool_invocations')
        .insert({
          agent_id,
          client_id,
          conversation_id,
          remote_jid,
          function_name: functionName,
          arguments: JSON.parse(truncatedArgs),
          result: JSON.parse(truncatedResult),
          success,
          error_message: errorMessage,
          execution_time_ms: executionTimeMs
        });

      console.log(`📊 Tool invocation logged: ${functionName}`);
    } catch (error) {
      console.error('❌ Erro ao registrar tool invocation:', error);
      // Não falhar a execução por erro de logging
    }
  }

  /**
   * Verifica se a função pertence ao BookingTool
   */
  private isBookingFunction(functionName: string): boolean {
    return [
      'consultar_agendamentos',
      'verificar_disponibilidade',
      'criar_agendamento',
      'reagendar_agendamento',
      'cancelar_agendamento'
    ].includes(functionName);
  }
}

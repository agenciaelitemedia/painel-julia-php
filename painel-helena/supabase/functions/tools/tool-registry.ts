/**
 * Tool Registry - Registro central de todas as tools disponíveis
 */

import { ToolDefinition, ToolsConfig } from "./types.ts";
import { BookingTool } from "./booking-tool.ts";

export class ToolRegistry {
  private config: ToolsConfig;

  constructor(config: ToolsConfig) {
    this.config = config;
  }

  /**
   * Retorna todas as definições de tools habilitadas
   */
  getEnabledToolDefinitions(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    if (this.config.enabled_tools.includes('booking')) {
      tools.push(...BookingTool.getDefinitions());
    }

    // Futuras tools podem ser adicionadas aqui
    // if (this.config.enabled_tools.includes('search')) {
    //   tools.push(...SearchTool.getDefinitions());
    // }

    console.log(`📋 Tools habilitadas: ${this.config.enabled_tools.join(', ')}`);
    console.log(`📝 Total de funções disponíveis: ${tools.length}`);

    return tools;
  }

  /**
   * Verifica se há alguma tool habilitada
   */
  hasEnabledTools(): boolean {
    return this.config.enabled_tools.length > 0;
  }

  /**
   * Retorna a configuração de uma tool específica
   */
  getToolConfig(toolName: string): any {
    switch (toolName) {
      case 'booking':
        return this.config.booking;
      default:
        return null;
    }
  }

  /**
   * Retorna a lista de tools habilitadas
   */
  getEnabledTools(): string[] {
    return this.config.enabled_tools;
  }
}

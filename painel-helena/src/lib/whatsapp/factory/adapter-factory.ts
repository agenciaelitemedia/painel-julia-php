/**
 * Factory para criar o adapter correto baseado no provider
 */

import type { IWhatsAppAdapter } from '../adapters/base.adapter';
import { UazapAdapter } from '../adapters/uazap.adapter';
import { EvolutionAdapter } from '../adapters/evolution.adapter';
import { OfficialAdapter } from '../adapters/official.adapter';
import type { WhatsAppProvider } from '../types/common';

export class WhatsAppAdapterFactory {
  private static adapters: Map<WhatsAppProvider, IWhatsAppAdapter> = new Map();

  /**
   * Cria ou retorna adapter cached para o provider especificado
   */
  static getAdapter(provider: WhatsAppProvider): IWhatsAppAdapter {
    // Retornar adapter já criado se existir
    if (this.adapters.has(provider)) {
      return this.adapters.get(provider)!;
    }

    // Criar novo adapter
    let adapter: IWhatsAppAdapter;

    switch (provider) {
      case 'uazap':
        adapter = new UazapAdapter();
        break;
      case 'evolution':
        adapter = new EvolutionAdapter();
        break;
      case 'official':
        adapter = new OfficialAdapter();
        break;
      default:
        throw new Error(`Unknown WhatsApp provider: ${provider}`);
    }

    // Armazenar em cache
    this.adapters.set(provider, adapter);

    return adapter;
  }

  /**
   * Limpar cache de adapters
   */
  static clearCache(): void {
    this.adapters.clear();
  }
}

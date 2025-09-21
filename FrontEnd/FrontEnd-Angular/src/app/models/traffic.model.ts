/**
 * =========================================================================
 * MODELOS DE DADOS PARA O FRONTEND - SINCRONIZADOS COM A API
 * Versão: 1.1.0
 *
 * Descrição: Este ficheiro define as "interfaces" TypeScript que representam
 * as respostas da nossa API Backend. Usar estas interfaces garante
 * que o nosso código frontend seja robusto e com tipagem segura.
 * =========================================================================
 */

// frontend/src/app/models/traffic.model.ts

/**
 * Define a estrutura da resposta do endpoint `GET /api/traffic`.
 */
export interface ClientTrafficSummary {
  ip: string;
  inbound: number;
  outbound: number;
  name?: string; // Campo opcional para o nome do cliente
}

/**
 * Define a estrutura da resposta do endpoint `GET /api/traffic/{client_ip}/protocols`.
 */
export interface ProtocolDrilldown {
  name: string;   // Nome do protocolo (ex: "TCP", "UDP")
  inbound: number;  // Bytes de entrada para este protocolo
  outbound: number; // Bytes de saída para este protocolo
  y: number;        // Soma de inbound + outbound, para a altura total da barra
}

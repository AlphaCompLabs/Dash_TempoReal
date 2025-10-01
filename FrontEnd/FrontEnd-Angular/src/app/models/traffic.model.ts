/*
# =====================================================================================
# SERVIDOR FRONTEND - MODELOS DE DADOS (INTERFACES)
# Versão: 1.1.1 (Padronização de Documentação)
#
# Autor(es): Equipe Frontend 
# Data: 2025-09-30
# Descrição: Este arquivo define as interfaces TypeScript que representam os
#            contratos de dados da API Backend. O uso destas interfaces garante
#            que o código da aplicação seja robusto e com tipagem segura.
# =====================================================================================
*/

// --- INTERFACE: ClientTrafficSummary ---
/**
 * Representa o resumo do tráfego para um único cliente.
 * Corresponde à estrutura de dados do endpoint `GET /api/traffic`.
 */
export interface ClientTrafficSummary {
  /** O endereço IP do cliente. */
  ip: string;

  /** O total de bytes recebidos (download) pelo cliente. */
  inbound: number;

  /** O total de bytes enviados (upload) pelo cliente. */
  outbound: number;

  /** Nome opcional do cliente (se resolvido via DNS ou outro método). */
  name?: string;
}


// --- INTERFACE: ProtocolDrilldown ---
/**
 * Representa os dados de tráfego detalhados por protocolo para um cliente específico.
 * Corresponde à estrutura de dados do endpoint `GET /api/traffic/{client_ip}/protocols`.
 */
export interface ProtocolDrilldown {
  /** O nome do protocolo (ex: "TCP", "UDP", "HTTP"). */
  name: string;

  /** O total de bytes recebidos (download) para este protocolo. */
  inbound: number;

  /** O total de bytes enviados (upload) para este protocolo. */
  outbound: number;

  /** A soma de `inbound` + `outbound`, usada para visualizações de gráfico. */
  y: number;
}


// --- INTERFACE: HistoricalDataPoint ---
/**
 * Representa um único ponto de dados na série temporal do tráfego total.
 * Usado para alimentar o gráfico de histórico.
 */
export interface HistoricalDataPoint {
  /** O timestamp (época Unix, em segundos) de quando a medição foi feita. */
  timestamp: number;

  /** O tráfego total de entrada (download) de todos os clientes nesse ponto no tempo. */
  total_inbound: number;

  /** O tráfego total de saída (upload) de todos os clientes nesse ponto no tempo. */
  total_outbound: number;
}
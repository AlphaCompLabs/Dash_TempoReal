// ============================================================================
// Interface para dado vindo da API em Python
// ============================================================================

export interface ProtocolDataFromAPI {
  in: number;
  out: number;
}

export interface ClientDataFromAPI {
  in_bytes: number;
  out_bytes: number;
  protocols: { [key: string]: ProtocolDataFromAPI };
}

export interface TrafficPayloadFromAPI {
  host: string;
  iface?: string;
  server_ip?: string;
  window_start: number;
  window_end: number;
  clients: { [key: string]: ClientDataFromAPI };
}

// Estrutura dos ENDPOINTS ESPECÍFICOS da API
export interface ClientTrafficSummaryFromAPI {
  ip: string;
  inbound: number;    // in_bytes
  outbound: number;   // out_bytes
}

export interface ProtocolDrilldownFromAPI {
  name: string;       // Nome do protocolo
  y: number;          // Valor TOTAL (in + out)
  inbound: number;    // in_bytes
  outbound: number;
}

export interface NetworkClient {
  ip: string;
  downloadValue: number;  // Já convertido para MB
  uploadValue: number;    // Já convertido para MB
  rawData?: ClientDataFromAPI; // Dados brutos se necessário
}

export interface ProtocolData {
  protocol: string;       // Nome do protocolo para exibição
  downloadValue: number;  // Valor de download em MB
  uploadValue: number;    // Valor de upload em MB
  totalValue?: number;    // Valor total (apenas para referência)
}

export interface TrafficStats {
  activeClients: number;
  totalIn: string;        // Formatado como "X.X MB"
  totalOut: string;       // Formatado como "X.X MB"
  totalGeneral: string;   // Formatado como "X.X MB"
}

export type TooltipData = {
  downloadValue: number;
  uploadValue: number;
};

export type ServerStatus = 'connected' | 'error' | 'loading' | 'disconnected';

export interface ApiError {
  status: number;
  message: string;
  timestamp: Date;
}

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  POLLING_INTERVAL: 5000, // 5 segundos
  TIMEOUT: 10000, // 10 segundos
  MAX_RETRIES: 3
} as const;

export const CHART_CONFIG = {
  MIN_CHART_VALUE: 5,
  AXIS_DIVISIONS: 5,
  ANIMATION_DURATION: 200
} as const;


// // Arquivo para estruturar dados de tráfego

//Resposta do backend (gráfico principalr)
export interface ClientTrafficSummary {
    ip: string;
    inbound: number;
    outbound: number;
}

// resposta do backend (drilldown por protocolo)
export interface ProtocolDrilldown {
    name: string;
    y: number;
}

// Modelo usando no frontend para gráfico principal
export interface NetworkClient {
    ip: string;
    downloadValue: number;
    uploadValue: number;
}

// Modelo usado no frontend para drilldown
export interface ProtocolData {
    protocol: string;
    downloadValue: number;
    uploadValue: number;
}






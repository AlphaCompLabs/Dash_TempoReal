// // Arquivo para estruturar dados de tráfego

// export interface ProtocolData {
//     in: number;
//     out: number;
// }

// // Protocolos de cada cliente
// export interface ClientProtocols {
//     HTTP: ProtocolData
//     FTP: ProtocolData
//     SSH: ProtocolData
// }

// // Cliente de rede 
// export interface TrafficClient {
//     ip: string;
//     bytes_in: number;
//     bytes_out: number;
//     protocols: ClientProtocols
// }

// // Para visualização nos gráficos
// export interface ChartDataItem {
//     ip: string;
//     entrada: number;
//     saida: number;
//     rawData: TrafficClient;
// }

// // Monitoramento dos dados no gráfico
// export interface ProtocolChartData {
//     name: string;
//     value: number;
//     entrada: number;
//     saida: number;
// }


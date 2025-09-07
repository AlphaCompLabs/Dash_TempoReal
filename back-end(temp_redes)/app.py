from flask import Flask, jsonify
from network_module.aggregator import TrafficAggregator
import os
import sys

# --- CONFIGURAÇÃO ---
# O IP do servidor a ser monitorado. Pode vir de uma variável de ambiente.
SERVER_IP_TO_MONITOR = os.getenv("SERVER_IP", "192.168.1.10") 
# A interface de rede onde a captura será feita.
CAPTURE_INTERFACE = "Ethernet" 

# --- INICIALIZAÇÃO DO MÓDULO ---
app = Flask(__name__)
aggregator = TrafficAggregator(server_ip=SERVER_IP_TO_MONITOR, window_size=5)

# --- ENDPOINT DA API ---
@app.route('/api/traffic_data', methods=['GET'])
def get_traffic_data():
    """
    Este é o endpoint que o frontend chamará a cada 5 segundos.
    Ele pega os dados mais recentes do seu módulo agregador.
    """
    data = aggregator.get_latest_window()
    if data is None:
        # Retorna uma resposta vazia se não houver novos dados ainda
        return jsonify({"clients": {}})
    return jsonify(data)

if __name__ == '__main__':
    # Verifica se o script está sendo executado como administrador (necessário para a Scapy)
    try:
        if os.geteuid() != 0: # Apenas para Linux/macOS
             print("ERRO: Este script precisa ser executado com privilégios de root (sudo) para capturar pacotes.")
             sys.exit(1)
    except AttributeError: # Para Windows, onde geteuid não existe
        print("AVISO: Certifique-se de executar este terminal como Administrador.")


    # Inicia seu módulo em uma thread de fundo
    aggregator.start(interface=CAPTURE_INTERFACE)
    
    # Inicia o servidor web do Flask
    # use_reloader=False é importante para não iniciar duas instâncias do seu agregador
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

    # Garante que a captura pare quando o servidor for encerrado
    aggregator.stop()

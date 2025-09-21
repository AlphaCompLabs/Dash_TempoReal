# =====================================================================================
# MÓDULO AGREGADOR DE TRÁFEGO DE REDE
# Versão: 2.1.0 (Refatorado para snapshot não destrutivo)
#
# Autor: Equipe de Análise de Rede
# Descrição: Este módulo fornece a classe `Aggregator`, projetada para coletar e
#            agregar dados de tráfego de rede em janelas de tempo discretas.
#            É thread-safe e otimizada para alta performance na ingestão de dados.
# =====================================================================================

# --- SEÇÃO 0: IMPORTAÇÕES ---
import threading
from collections import defaultdict
from typing import Dict, Any, Optional, Callable

# Supondo que 'util.py' exista no mesmo diretório ou em um caminho acessível.
from util import now_ts

# --- SEÇÃO 1: CONSTANTES DE MÓDULO ---
__VERSION__ = "2.1.0"

# --- SEÇÃO 2: DEFINIÇÃO DA CLASSE PRINCIPAL ---
class Aggregator:
    """
    Agrega dados de tráfego de rede em janelas de tempo.

    Esta classe é thread-safe, permitindo que múltiplos fluxos de dados
    sejam adicionados simultaneamente sem corromper os dados.
    """

    def __init__(self, window_s: int = 5, max_clients: int = 0, anon: Optional[Callable[[str], str]] = None):
        """
        Inicializa o agregador de dados.

        :param window_s: O tamanho da janela de tempo em segundos para a agregação.
        :param max_clients: O número máximo de clientes a serem retornados (top-K por tráfego).
                            Se 0, todos os clientes são retornados.
        :param anon: Uma função opcional para anonimizar o endereço IP do cliente.
        """
        self.window_s = window_s
        self.max_clients = max_clients
        self.anon = anon
        self.lock = threading.Lock()

        # Calcula o início da janela de tempo atual para garantir alinhamento.
        now = now_ts()
        start = now - (now % self.window_s)
        self._current = self._new_window(start)

    # --- MÉTODOS PÚBLICOS (API DA CLASSE) ---

    def add(self, ts: float, client_ip: str, direction: str, nbytes: int, proto: str):
        """
        Adiciona os dados de um único evento/pacote de rede ao agregador.

        Este é o principal método de ingestão de dados e é otimizado para ser chamado
        frequentemente e por múltiplas threads.
        """
        # O `with self.lock:` garante a execução atômica deste bloco,
        # prevenindo "race conditions" e garantindo a integridade dos dados.
        with self.lock:
            # Verifica se o timestamp atual exige a criação de uma nova janela de tempo.
            self._maybe_roll(ts)

            ip_key = self.anon(client_ip) if self.anon else client_ip
            direction_key = "in" if direction == "in" else "out"
            num_bytes = int(nbytes)

            # Graças ao defaultdict, o cliente e o protocolo são criados se não existirem.
            client_data = self._current["clients"][ip_key]
            client_data[direction_key] += num_bytes
            client_data["proto"][proto][direction_key] += num_bytes

            # Incrementa os contadores globais da janela.
            self._current["pkt_count"] += 1
            self._current["byte_count"] += num_bytes

    def snapshot(self, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        [NÃO DESTRUTIVO] Gera um "snapshot" dos dados agregados na janela atual.

        Este método é apenas para leitura e não avança ou reinicia a janela de tempo.

        :param meta: Metadados adicionais (host, iface, etc.) a serem incluídos.
        :return: Um dicionário com o resumo completo dos dados da janela atual.
        """
        with self.lock:
            # Chama o método de formatação interna para construir o payload.
            return self._format_payload(meta or {})

    def get_snapshot_and_roll_window(self, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        [DESTRUTIVO] Gera um snapshot da janela atual e imediatamente avança para a próxima.

        Este método deve ser usado pelo processo que consome os dados periodicamente,
        garantindo que nenhum dado seja contado duas vezes.

        :param meta: Metadados adicionais (host, iface, etc.) a serem incluídos.
        :return: Um dicionário com o resumo completo dos dados da janela que acabou de fechar.
        """
        with self.lock:
            payload = self._format_payload(meta or {})
            # Avança para a próxima janela após gerar o payload.
            start_next = self._current["end"]
            self._current = self._new_window(start_next)
            return payload

    # --- MÉTODOS PRIVADOS (LÓGICA INTERNA) ---

    def _maybe_roll(self, ts: float):
        """
        Verifica se o timestamp `ts` pertence a uma janela futura. Se sim,
        "rola" a janela atual para a próxima.
        """
        while ts >= self._current["end"]:
            start_next = self._current["end"]
            self._current = self._new_window(start_next)

    def _format_payload(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        """Formata os dados da janela atual em um payload de saída padronizado."""
        clients_dict = self._current["clients"]
        keep = None

        # Lógica para limitar o número de clientes (Top-K)
        if self.max_clients and len(clients_dict) > self.max_clients:
            # Ordena os clientes pelo tráfego total (in + out) em ordem decrescente.
            top_clients = sorted(
                clients_dict.items(),
                key=lambda item: item[1]["in"] + item[1]["out"],
                reverse=True
            )
            # Cria um conjunto com os IPs dos top-K clientes para verificação rápida.
            keep = {ip for ip, _ in top_clients[:self.max_clients]}

        # Formatação dos dados de saída
        clients_out = {}
        total_in, total_out = 0, 0
        for ip, v in clients_dict.items():
            if keep is not None and ip not in keep:
                continue

            in_b, out_b = int(v["in"]), int(v["out"])
            total_in += in_b
            total_out += out_b

            clients_out[ip] = {
                "in_bytes": in_b,
                "out_bytes": out_b,
                "protocols": {p: {"in": int(pv["in"]), "out": int(pv["out"])} for p, pv in v["proto"].items()}
            }

        # Montagem do payload final
        return {
            "version": __VERSION__,
            "window_start": self._current["start"],
            "window_end": self._current["end"],
            "emitted_at": now_ts(),
            "host": meta.get("host"),
            "iface": meta.get("iface"),
            "server_ip": meta.get("server_ip"),
            "n_clients": len(clients_out),
            "total_in": total_in,
            "total_out": total_out,
            "pkt_count": self._current["pkt_count"],
            "byte_count": self._current["byte_count"],
            "clients": clients_out
        }

    def _new_window(self, start: float) -> Dict[str, Any]:
        """Cria e retorna a estrutura de dados para uma nova janela de agregação."""
        return {
            "start": start,
            "end": start + self.window_s,
            "clients": defaultdict(lambda: {
                "in": 0, "out": 0, "proto": defaultdict(lambda: {"in": 0, "out": 0})
            }),
            "pkt_count": 0,
            "byte_count": 0
        }
# Importa as bibliotecas necessárias.
import threading  # Para controle de concorrência (Lock) e garantir que o código seja thread-safe.
from collections import defaultdict  # Dicionário especial que cria itens padrão para chaves que não existem.
from typing import Dict, Any, Optional, Callable  # Para anotações de tipo, melhorando a legibilidade.
from util import now_ts  # Uma função utilitária (não mostrada) que provavelmente retorna o timestamp atual.

# Define a versão do código. Útil para rastreamento em logs ou payloads.
__VERSION__ = "2.0.0"

class Aggregator:
    """
    Uma classe para agregar dados de tráfego de rede em janelas de tempo.
    É projetada para ser thread-safe, permitindo que múltiplos fluxos de dados
    sejam adicionados simultaneamente sem corromper os dados.
    """

    def __init__(self, window_s: int = 5, max_clients: int = 0, anon: Optional[Callable[[str], str]] = None):
        """
        Inicializa o agregador.

        :param window_s: O tamanho da janela de tempo em segundos para agregar os dados.
        :param max_clients: O número máximo de clientes a serem retornados no snapshot (top-K por tráfego). 0 para ilimitado.
        :param anon: Uma função opcional para anonimizar o endereço IP do cliente.
        """
        now = now_ts()
        # Calcula o início da janela de tempo atual, arredondando o timestamp para o múltiplo anterior de window_s.
        start = now - (now % window_s)

        self.window_s = window_s  # Armazena o tamanho da janela.
        self.lock = threading.Lock()  # Cria um Lock para garantir a segurança em ambientes com múltiplas threads (thread-safety).
        self.max_clients = max_clients  # Armazena o limite de clientes.
        self.anon = anon  # Armazena a função de anonimização.
        
        # Inicializa a estrutura de dados da janela atual chamando o método auxiliar _new_window.
        self._current = self._new_window(start)

    def _new_window(self, start: float) -> Dict[str, Any]:
        """
        Cria e retorna a estrutura de dados para uma nova janela de agregação vazia.

        :param start: O timestamp de início da nova janela.
        :return: Um dicionário representando a nova janela.
        """
        return {
            "start": start,
            "end": start + self.window_s,
            # Usa defaultdict para que, ao tentar acessar um cliente ou protocolo que ainda não existe,
            # ele seja criado automaticamente com a estrutura padrão, evitando erros e simplificando o código.
            "clients": defaultdict(lambda: {
                "in": 0, "out": 0, "proto": defaultdict(lambda: {"in": 0, "out": 0})
            }),
            "pkt_count": 0,
            "byte_count": 0
        }

    def _maybe_roll(self, ts: float):
        """
        Verifica se o timestamp `ts` pertence a uma janela futura. Se sim,
        "rola" a janela atual para a próxima, descartando os dados antigos e criando uma nova.
        Usa um `while` para o caso de haver um longo período sem dados, pulando janelas vazias.
        """
        while ts >= self._current["end"]:
            # O início da próxima janela é o fim da janela atual.
            start_next = self._current["end"]
            # Substitui a janela atual por uma nova e vazia.
            self._current = self._new_window(start_next)

    def add(self, ts: float, client_ip: str, direction: str, nbytes: int, proto: str):
        """
        Adiciona os dados de um único evento/pacote de rede ao agregador.
        Esta é a principal função de ingestão de dados.
        """
        # O `with self.lock:` garante que apenas uma thread possa executar este bloco por vez.
        # Isso previne "race conditions", onde duas threads tentam modificar os contadores ao mesmo tempo.
        with self.lock:
            # Primeiro, verifica se precisamos avançar para uma nova janela de tempo.
            self._maybe_roll(ts)

            # Aplica a função de anonimização no IP, se ela foi fornecida.
            ip_key = self.anon(client_ip) if self.anon else client_ip

            # Normaliza a direção para garantir que seja "in" ou "out".
            d = "in" if direction == "in" else "out"
            n = int(nbytes)

            # Acessa os dados do cliente. Graças ao defaultdict, se o IP não existir, ele será criado.
            c = self._current["clients"][ip_key]
            
            # Incrementa os contadores de bytes para a direção específica.
            c[d] += n
            # Incrementa os contadores de bytes para o protocolo e direção específicos.
            c["proto"][proto][d] += n
            
            # Incrementa os contadores globais da janela.
            self._current["pkt_count"] += 1
            # self._current["pkt_count"] = 0
            self._current["byte_count"] += n

    def snapshot(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera um "snapshot" (um retrato) dos dados agregados na janela atual,
        formatado em um payload pronto para ser enviado ou salvo.

        :param meta: Metadados adicionais (host, interface, etc.) a serem incluídos no payload.
        :return: Um dicionário com o resumo completo dos dados da janela.
        """
        # Usa o lock para garantir uma leitura consistente dos dados, impedindo que a janela
        # seja modificada (por exemplo, por um `add`) enquanto o snapshot é criado.
        with self.lock:
            # --- Lógica para limitar o número de clientes (Top-K) ---
            clients_dict = self._current["clients"]
            if self.max_clients and len(clients_dict) > self.max_clients:
                items = []
                # Calcula o tráfego total (in + out) para cada cliente.
                for ip, v in clients_dict.items():
                    total = int(v["in"]) + int(v["out"])
                    items.append((ip, total))
                
                # Ordena os clientes pelo tráfego total em ordem decrescente.
                items.sort(key=lambda x: x[1], reverse=True)
                
                # Cria um conjunto com os IPs dos top-K clientes para uma verificação rápida.
                keep = set(ip for ip, _ in items[:self.max_clients])
            else:
                # Se não houver limite, `keep` é None, e todos os clientes serão incluídos.
                keep = None

            # --- Formatação dos dados de saída ---
            clients_out = {}
            total_in = 0
            total_out = 0
            for ip, v in clients_dict.items():
                # Se a limitação de clientes está ativa, ignora os IPs que não estão na lista `keep`.
                if keep is not None and ip not in keep:
                    continue

                in_b = int(v["in"]); out_b = int(v["out"])
                total_in += in_b; total_out += out_b

                # Monta a estrutura de saída para cada cliente.
                clients_out[ip] = {
                    "in_bytes": in_b,
                    "out_bytes": out_b,
                    # Converte o defaultdict interno de protocolos para um dicionário normal.
                    "protocols": {p: {"in": int(pv["in"]), "out": int(pv["out"])} for p, pv in v["proto"].items()}
                }

            # --- Montagem do payload final ---
            payload = {
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

            start_next = self._current["end"]
            self._current = self._new_window(start_next)
            return payload
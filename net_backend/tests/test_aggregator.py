import time
from app import Aggregator, PacketEvent

def test_roll_and_sum():
    ag = Aggregator(window_s=5, max_windows=10)
    t0 = 1_700_000_000.0
    # janela [t0..t0+5)
    ag.add_event(PacketEvent(ts=t0+1, client_ip="10.0.0.2", direction="in", nbytes=100, proto="HTTP"))
    ag.add_event(PacketEvent(ts=t0+2, client_ip="10.0.0.2", direction="out", nbytes=50,  proto="HTTP"))
    # força rolagem
    ag._maybe_roll(t0+6)

    hist = ag.latest(1)[0]
    assert hist["clients"]["10.0.0.2"]["in_bytes"] == 100
    assert hist["clients"]["10.0.0.2"]["out_bytes"] == 50
    assert hist["clients"]["10.0.0.2"]["protocols"]["HTTP"]["in"] == 100
    assert hist["clients"]["10.0.0.2"]["protocols"]["HTTP"]["out"] == 50

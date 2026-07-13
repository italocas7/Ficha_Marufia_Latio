import http.server
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.stdout = open(ROOT / "server.out.log", "a", encoding="utf-8", buffering=1)
sys.stderr = open(ROOT / "server.err.log", "a", encoding="utf-8", buffering=1)

server = http.server.ThreadingHTTPServer(("127.0.0.1", 4173), http.server.SimpleHTTPRequestHandler)
print("Serving Ficha de Marufia (Latio) at http://127.0.0.1:4173/")
server.serve_forever()

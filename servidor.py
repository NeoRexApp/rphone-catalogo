"""
servidor.py
"""
from flask import Flask, send_from_directory, Response
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
from decimal import Decimal
from pathlib import Path

DB_CONFIG = {
    "host":     os.environ.get("PGHOST",     "localhost"),
    "port":     os.environ.get("PGPORT",     5432),
    "dbname":   os.environ.get("PGDATABASE", "catalogo_db"),
    "user":     os.environ.get("PGUSER",     "postgres"),
    "password": os.environ.get("PGPASSWORD", "Joyce220324")
}

PORT = int(os.environ.get("PORT", 8080))
WEB_DIR = Path(__file__).parent
UPLOADS_DIR = Path(__file__).parent / "uploads"

app = Flask(__name__, static_folder=None)

def decimal_fix(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def get_conn():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

@app.route("/data/catalogo-local.json")
def catalogo_json():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.activo::text AS activo, p.tipo, c.slug AS categoria,
            p.nombre, p.detalle, p.precio, p.precio_seguidor,
            p.imagen_url AS imagen, p.stock, p.origen_hoja, p.whatsapp_texto,
            p.orden, p.sku, p.marca, p.descripcion_larga, p.costo,
            p.precio_mayoreo, p.precio_subcliente, p.precio_pieza
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = TRUE ORDER BY p.orden ASC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    productos = []
    for r in rows:
        d = dict(r)
        d["activo"] = "TRUE"
        if not d.get("imagen"):
            d["imagen"] = None
        productos.append(d)
    return Response(json.dumps(productos, ensure_ascii=False, default=decimal_fix), mimetype="application/json")

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    numero = Path(filename).stem
    for f in UPLOADS_DIR.rglob(f"{numero}*"):
        return send_from_directory(f.parent, f.name)
    return "", 404

@app.route("/")
@app.route("/<path:filename>")
def serve_web(filename="index.html"):
    file_path = WEB_DIR / filename
    if file_path.is_file():
        return send_from_directory(WEB_DIR, filename)
    return send_from_directory(WEB_DIR, "index.html")

if __name__ == "__main__":
    print(f"\n  Servidor listo en puerto {PORT}\n")
    app.run(debug=False, host="0.0.0.0", port=PORT)

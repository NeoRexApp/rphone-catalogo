import psycopg2
from psycopg2.extras import RealDictCursor
import os
import shutil

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "catalogo_db",
    "user": "postgres",
    "password": "Joyce220324"
}

IMG_ORIGEN = r"C:\Users\Dante\Downloads\Img Web"
UPLOADS_DIR = r"C:\pagina web Rphone\Pgin web\uploads"

conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
cur = conn.cursor()

cur.execute("""
    SELECT p.imagen_url, c.slug
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.imagen_url IS NOT NULL AND p.activo = TRUE
""")
rows = cur.fetchall()
cur.close()
conn.close()

copiadas = 0
no_encontradas = 0

for r in rows:
    imagen = r["imagen_url"]
    categoria = r["slug"] or "sin-categoria"
    nombre = os.path.basename(imagen)
    origen = os.path.join(IMG_ORIGEN, nombre)
    destino_dir = os.path.join(UPLOADS_DIR, categoria)
    destino = os.path.join(destino_dir, nombre)
    os.makedirs(destino_dir, exist_ok=True)
    if os.path.exists(origen):
        shutil.copy2(origen, destino)
        copiadas += 1
    else:
        no_encontradas += 1

print(f"Copiadas: {copiadas} | No encontradas: {no_encontradas}")

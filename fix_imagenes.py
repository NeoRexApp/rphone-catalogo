import psycopg2, os
conn = psycopg2.connect(host='localhost',port=5432,dbname='catalogo_db',user='postgres',password='Joyce220324')
cur = conn.cursor()
archivos = os.listdir(r'C:\pagina web Rphone\Pgin web\uploads')
for f in archivos:
    partes = f.split('-')
    num = partes[0].lstrip('0')
    if num.isdigit():
        cur.execute('UPDATE productos SET imagen_url = %s WHERE id = %s::text', (f'/uploads/{f}', num))
conn.commit()
cur.close()
conn.close()
print('Listo')

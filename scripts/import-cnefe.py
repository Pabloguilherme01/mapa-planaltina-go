"""Importa somente estabelecimentos identificados com coordenada original do Censo.
Uso: python scripts/import-cnefe.py origem.csv data/cnefe-2022-planaltina.json
Fonte e dicionário: IBGE/CNEFE, CSV/Municipio/52_GO/5217609_PLANALTINA.zip.
"""
import csv
import datetime
import hashlib
import json
import pathlib
import re
import sys
import unicodedata

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value.upper()) if not unicodedata.combining(c))

def import_rows(stream):
    rows, seen = [], set()
    for item in csv.DictReader(stream, delimiter=';'):
        if item['COD_MUNICIPIO'] != '5217609' or item['NV_GEO_COORD'] != '1' or item['COD_ESPECIE'] not in {'3', '4', '5', '6', '8'}:
            continue
        name = ' '.join(item['DSC_ESTABELECIMENTO'].split())
        if normalize(name) in {'LOJA', 'LOJAS', 'LOTE', 'TORRE', 'GARAGEM', 'GALPAO', 'DEPOSITO'}:
            continue
        # Excluir unidades vazias, não identificadas ou em construção.
        if len(name) < 3 or not re.search(r'[A-Za-zÀ-ÿ]{2}', name) or re.search(r'\b(VAG[AO]S?|VAZI[AO]S?|SEM NOME|SEM IDENTIFICACAO|DESATIVAD[AO]|FECHAD[AO]|DESOCUPAD[AO]S?|NAO TEM|NAO INFORMAD[AO]|ALUGA SE|EM CONSTRUCAO|OBRA)\b', normalize(name)):
            continue
        try:
            lat, lng = float(item['LATITUDE']), float(item['LONGITUDE'])
        except ValueError:
            continue
        if not (-15.503 <= lat <= -15.016 and -48.108 <= lng <= -47.462):
            continue
        street = ' '.join(item[k].strip() for k in ['NOM_TIPO_SEGLOGR', 'NOM_TITULO_SEGLOGR', 'NOM_SEGLOGR'] if item[k].strip())
        number = item['NUM_ENDERECO'].strip()
        address = ', '.join(x for x in [street, number if number and number != '0' else ''] if x)
        district = item['DSC_LOCALIDADE'].strip()
        key = (normalize(name), item['COD_ESPECIE'], lat, lng, normalize(address))
        if key in seen:
            continue
        if any(len(value) > 300 or re.search(r'[<>\x00-\x1f]', value) for value in [name, address, district]):
            continue
        seen.add(key)
        code = item['COD_UNICO_ENDERECO']
        if not re.fullmatch(r'[1-9]\d*', code):
            continue
        suffix = hashlib.sha256(json.dumps(key, ensure_ascii=False).encode('utf-8')).hexdigest()[:12]
        rows.append([f'cnefe-2022-{code}-{suffix}', name, item['COD_ESPECIE'], lat, lng, address, district])
    return rows

if __name__ == '__main__':
    with open(sys.argv[1], encoding='utf-8-sig', newline='') as source:
        rows = import_rows(source)
    target = pathlib.Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({'municipality': '5217609', 'year': 2022,
        'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'), 'rows': rows}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(rows)} estabelecimentos históricos identificados; filtro municipal final no build.')

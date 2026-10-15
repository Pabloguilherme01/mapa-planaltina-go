"""Import the official ANP CSV into a small municipal snapshot, without contacts or geometry."""
import csv
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

source = Path(sys.argv[1])
items = []
with source.open(encoding='utf-8-sig', newline='') as stream:
    reader = csv.DictReader(stream, delimiter=';')
    required = {'CODIGOISIMP', 'AUTORIZACAO', 'RAZAOSOCIAL', 'ENDERECO', 'COMPLEMENTO', 'BAIRRO', 'BANDEIRA', 'UF', 'MUNICIPIO'}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError('Colunas ANP divergentes')
    for row in reader:
        if row['UF'].strip() != 'GO' or row['MUNICIPIO'].strip() != 'PLANALTINA':
            continue
        item = dict(id=row['CODIGOISIMP'].strip(), authorization=row['AUTORIZACAO'].strip(),
                    name=row['RAZAOSOCIAL'].strip(), address=' • '.join(value.strip() for value in [row['ENDERECO'], row['COMPLEMENTO']] if value.strip()),
                    district=row['BAIRRO'].strip(), brand=row['BANDEIRA'].strip(), municipality='PLANALTINA', uf='GO')
        if not re.fullmatch(r'\d{1,12}', item['id']) or not re.fullmatch(r'PR/GO\d{7}', item['authorization']) or not any(c.isalpha() for c in item['name']) or not item['address']:
            raise ValueError('Registro ANP municipal inválido')
        if any(len(value) > 500 for value in item.values()):
            raise ValueError('Campo ANP excessivo')
        items.append(item)
if not items or len(items) > 500 or len({item['id'] for item in items}) != len(items) or len({item['authorization'] for item in items}) != len(items):
    raise ValueError('Cadastro ANP vazio ou duplicado')
with source.open('rb') as stream:
    digest = hashlib.file_digest(stream, 'sha256').hexdigest()
snapshot = dict(version=1, retrievedAt=datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
                sourceSha256=digest, geometry='not_provided', items=sorted(items, key=lambda item: item['name']))
target = Path(__file__).resolve().parents[1] / 'src/data/fuelRegistry.json'
temporary = target.with_suffix('.json.tmp')
temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
os.replace(temporary, target)
print(f'ANP validada: {len(items)} registros de Planaltina-GO; sem coordenadas ou preços.')

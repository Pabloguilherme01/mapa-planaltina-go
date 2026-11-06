import csv
import importlib.util
import io
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('cnefe', pathlib.Path(__file__).parents[1] / 'scripts/import-cnefe.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CensusImport(unittest.TestCase):
    def rows(self, changes):
        base = dict(COD_MUNICIPIO='5217609', NV_GEO_COORD='1', COD_ESPECIE='6',
            DSC_ESTABELECIMENTO='Mercado de teste', LATITUDE='-15.4542', LONGITUDE='-47.6029',
            NOM_TIPO_SEGLOGR='Rua', NOM_TITULO_SEGLOGR='', NOM_SEGLOGR='Teste', NUM_ENDERECO='1',
            DSC_LOCALIDADE='Centro', COD_UNICO_ENDERECO='123')
        stream = io.StringIO()
        writer = csv.DictWriter(stream, fieldnames=list(base), delimiter=';')
        writer.writeheader()
        writer.writerows([{**base, **change} for change in changes])
        stream.seek(0)
        return module.import_rows(stream)

    def test_excludes_homes_estimates_vacancy_and_wrong_municipality(self):
        for change in [{'COD_ESPECIE': '1'}, {'COD_ESPECIE': '2'}, {'COD_ESPECIE': '7'},
            {'NV_GEO_COORD': '2'}, {'NV_GEO_COORD': '3'}, {'NV_GEO_COORD': '4'},
            {'COD_MUNICIPIO': '5300108'}, {'LATITUDE': ''}, {'DSC_ESTABELECIMENTO': 'LOJA VAGA'},
            {'DSC_ESTABELECIMENTO': 'SEM NOME'}]:
            with self.subTest(change=change):
                self.assertEqual(self.rows([change]), [])

    def test_deduplicates_and_keeps_ids_stable_when_input_order_changes(self):
        entries = [{}, {'DSC_ESTABELECIMENTO': 'Outro estabelecimento'}]
        first = self.rows(entries)
        self.assertEqual(self.rows([{}, {}]), first[:1])
        self.assertEqual(sorted(self.rows(list(reversed(entries)))), sorted(first))

if __name__ == '__main__':
    unittest.main()

import { Json2CsvExporter } from './json2csv-exporter';

describe('Json2CsvExporter', () => {
  let exporter: Json2CsvExporter;

  beforeEach(() => {
    exporter = new Json2CsvExporter();
  });

  it('debería exportar datos a CSV con BOM y separador', () => {
    const data = [
      { nombre: 'Juan', edad: 30 },
      { nombre: 'María', edad: 25 },
    ];

    const result = exporter.export(data);

    expect(result).toContain('\uFEFFsep=;');
    expect(result).toContain('"nombre";"edad"');
    expect(result).toContain('"Juan"');
    expect(result).toContain('"María"');
  });

  it('debería usar delimitador por defecto punto y coma', () => {
    const data = [{ a: 1, b: 2 }];
    const result = exporter.export(data);
    expect(result).toContain('"a";"b"');
  });

  it('debería aceptar delimitador personalizado', () => {
    const data = [{ a: 1, b: 2 }];
    const result = exporter.export(data, ',');
    expect(result).toContain('"a","b"');
  });
});

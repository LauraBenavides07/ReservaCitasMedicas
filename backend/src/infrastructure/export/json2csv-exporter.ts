import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';
import { ICsvExporter } from '../../application/abstractions/icsv-exporter.interface';

@Injectable()
export class Json2CsvExporter extends ICsvExporter {
  export<T extends Record<string, any>>(
    data: T[],
    delimiter: string = ';',
  ): string {
    const parser = new Parser({ delimiter });
    return `\uFEFFsep=${delimiter}\r\n` + parser.parse(data);
  }
}

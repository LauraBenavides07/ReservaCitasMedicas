export abstract class ICsvExporter {
  abstract export<T extends Record<string, any>>(
    data: T[],
    delimiter?: string,
  ): string;
}

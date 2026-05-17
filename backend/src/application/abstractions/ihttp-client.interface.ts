export abstract class IHttpClient {
  abstract post<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<{ data: T; status: number }>;
  abstract get<T = any>(url: string, headers?: Record<string, string>): Promise<{ data: T; status: number }>;
}

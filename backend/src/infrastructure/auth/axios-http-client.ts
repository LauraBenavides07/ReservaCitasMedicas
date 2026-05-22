import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IHttpClient } from '../../application/abstractions/ihttp-client.interface';

@Injectable()
export class AxiosHttpClient extends IHttpClient {
  async post<T = any>(
    url: string,
    data: any,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const config = headers ? { headers } : {};
    const response = await axios.post<T>(url, data, config);
    return { data: response.data, status: response.status };
  }

  async get<T = any>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const config = headers ? { headers } : {};
    const response = await axios.get<T>(url, config);
    return { data: response.data, status: response.status };
  }
}

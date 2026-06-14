import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Transaction } from './types';

@Injectable()
export class FiarService {
  constructor(private httpService: HttpService) {}

  async createTransaction(
    data: Partial<Transaction>,
    apiKey?: string,
  ): Promise<Transaction> {
    const url = `${process.env.FIAR_API_URL}/transactions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    } else {
      console.warn('No API Key provided for FIAR transaction');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<Transaction>(url, data, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling FIAR API:', error.message);
      // Re-throw the error preserving the response structure for proper error handling
      throw error;
    }
  }
}

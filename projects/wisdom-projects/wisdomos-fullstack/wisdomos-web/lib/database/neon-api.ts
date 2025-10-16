type NeonApiResponse<T = any> = {
  data: T[];
  total_row_count?: number;
  more_rows_available?: boolean;
  error?: string;
};

type QueryOptions = {
  where?: Record<string, any>;
  select?: string[];
  limit?: number;
  offset?: number;
  order?: string;
};

class NeonDataAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEON_API_ENDPOINT || '';
    this.apiKey = process.env.NEON_API_KEY || '';
    
    if (!this.baseUrl) {
      throw new Error('NEON_API_ENDPOINT environment variable is required');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<NeonApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Neon API request failed:', error);
      throw error;
    }
  }

  private buildQueryString(options: QueryOptions): string {
    const params = new URLSearchParams();
    
    if (options.select) {
      params.append('select', options.select.join(','));
    }
    
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        params.append(`where.${key}`, value);
      });
    }
    
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    if (options.offset) {
      params.append('offset', options.offset.toString());
    }
    
    if (options.order) {
      params.append('order', options.order);
    }
    
    return params.toString();
  }

  async select<T>(tableName: string, options: QueryOptions = {}): Promise<NeonApiResponse<T>> {
    const queryString = this.buildQueryString(options);
    const endpoint = `/tables/${tableName}/rows${queryString ? `?${queryString}` : ''}`;
    return this.request<T>('GET', endpoint);
  }

  async insert<T>(tableName: string, data: Partial<T> | Partial<T>[]): Promise<NeonApiResponse<T>> {
    const endpoint = `/tables/${tableName}/rows`;
    const payload = Array.isArray(data) ? { rows: data } : { rows: [data] };
    return this.request<T>('POST', endpoint, payload);
  }

  async update<T>(
    tableName: string,
    data: Partial<T>,
    where: Record<string, any>
  ): Promise<NeonApiResponse<T>> {
    const endpoint = `/tables/${tableName}/rows`;
    const payload = {
      data,
      where,
    };
    return this.request<T>('PUT', endpoint, payload);
  }

  async delete<T>(tableName: string, where: Record<string, any>): Promise<NeonApiResponse<T>> {
    const whereParams = new URLSearchParams();
    Object.entries(where).forEach(([key, value]) => {
      whereParams.append(`where.${key}`, value);
    });
    
    const endpoint = `/tables/${tableName}/rows?${whereParams.toString()}`;
    return this.request<T>('DELETE', endpoint);
  }

  async findById<T>(tableName: string, id: string | number): Promise<T | null> {
    const result = await this.select<T>(tableName, {
      where: { id },
      limit: 1,
    });
    
    return result.data?.[0] || null;
  }

  async findMany<T>(
    tableName: string,
    where: Record<string, any> = {},
    options: Omit<QueryOptions, 'where'> = {}
  ): Promise<T[]> {
    const result = await this.select<T>(tableName, {
      where,
      ...options,
    });
    
    return result.data || [];
  }

  async count(tableName: string, where: Record<string, any> = {}): Promise<number> {
    const result = await this.select(tableName, {
      where,
      select: ['count(*)'],
    });
    
    return result.total_row_count || 0;
  }
}

export const neonApi = new NeonDataAPI();
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class ApiClient {
  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
}

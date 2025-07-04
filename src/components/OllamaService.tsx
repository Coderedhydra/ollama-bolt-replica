import axios, { AxiosError } from 'axios';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

export interface OllamaError {
  error: string;
  code?: string;
  details?: string;
}

export class OllamaConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'OllamaConnectionError';
  }
}

export class OllamaModelError extends Error {
  constructor(message: string, public modelName?: string) {
    super(message);
    this.name = 'OllamaModelError';
  }
}

export class OllamaService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    timeout: number = 30000,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} attempt ${attempt} failed:`, error);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new OllamaConnectionError(
      `${operationName} failed after ${this.retryAttempts} attempts: ${lastError?.message}`,
      lastError || undefined
    );
  }

  async getModels(): Promise<OllamaModel[]> {
    return this.retryOperation(async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/api/tags`, {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.data || !Array.isArray(response.data.models)) {
          throw new Error('Invalid response format from Ollama models endpoint');
        }

        return response.data.models;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            throw new OllamaConnectionError(
              'Cannot connect to Ollama. Make sure Ollama is running on ' + this.baseUrl
            );
          }
          if (error.code === 'ECONNABORTED') {
            throw new OllamaConnectionError('Request timeout. Ollama may be overloaded.');
          }
        }
        throw error;
      }
    }, 'Get models');
  }

  async chat(
    model: string,
    messages: OllamaMessage[],
    onStream?: (content: string) => void
  ): Promise<string> {
    if (!model) {
      throw new OllamaModelError('Model name is required');
    }

    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    // Validate messages format
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content');
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        throw new Error('Message role must be user, assistant, or system');
      }
    }

    return this.retryOperation(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/chat`,
          {
            model: model.trim(),
            messages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
            }
          },
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data || !response.data.message || !response.data.message.content) {
          throw new Error('Invalid response format from Ollama chat endpoint');
        }

        return response.data.message.content;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<OllamaError>;
          
          if (axiosError.response?.status === 404) {
            throw new OllamaModelError(
              `Model "${model}" not found. Please pull the model first.`,
              model
            );
          }
          
          if (axiosError.response?.data?.error) {
            throw new Error(`Ollama error: ${axiosError.response.data.error}`);
          }
          
          if (error.code === 'ECONNREFUSED') {
            throw new OllamaConnectionError(
              'Cannot connect to Ollama. Make sure Ollama is running on ' + this.baseUrl
            );
          }
        }
        throw error;
      }
    }, 'Chat with model');
  }

  async generate(
    model: string,
    prompt: string,
    system?: string
  ): Promise<string> {
    if (!model) {
      throw new OllamaModelError('Model name is required');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    return this.retryOperation(async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/generate`,
          {
            model: model.trim(),
            prompt: prompt.trim(),
            system: system?.trim(),
            stream: false,
            options: {
              temperature: 0.7,
            }
          },
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data || typeof response.data.response !== 'string') {
          throw new Error('Invalid response format from Ollama generate endpoint');
        }

        return response.data.response;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<OllamaError>;
          
          if (axiosError.response?.status === 404) {
            throw new OllamaModelError(
              `Model "${model}" not found. Please pull the model first.`,
              model
            );
          }
        }
        throw error;
      }
    }, 'Generate with model');
  }

  async pullModel(model: string, onProgress?: (progress: number) => void): Promise<void> {
    if (!model) {
      throw new OllamaModelError('Model name is required');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: model.trim() },
        {
          timeout: 300000, // 5 minutes for pulling models
          headers: {
            'Content-Type': 'application/json',
          },
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(Math.round(progress));
            }
          }
        }
      );

      if (response.data?.error) {
        throw new Error(`Failed to pull model: ${response.data.error}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new OllamaConnectionError(
            'Cannot connect to Ollama. Make sure Ollama is running on ' + this.baseUrl
          );
        }
      }
      throw new OllamaModelError(`Failed to pull model ${model}: ${(error as Error).message}`, model);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkModelExists(model: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some(m => m.name === model);
    } catch {
      return false;
    }
  }

  setBaseUrl(url: string): void {
    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL format. URL must start with http:// or https://');
    }
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const ollamaService = new OllamaService();
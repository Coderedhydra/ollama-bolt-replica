import axios from 'axios';

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

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  async chat(
    model: string,
    messages: OllamaMessage[],
    onStream?: (content: string) => void
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running on localhost:11434');
    }
  }

  async generate(
    model: string,
    prompt: string,
    system?: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt,
          system,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.response;
    } catch (error) {
      console.error('Ollama generate error:', error);
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running on localhost:11434');
    }
  }

  async pullModel(model: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: model },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to pull model:', error);
      throw new Error(`Failed to pull model ${model}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
}

export const ollamaService = new OllamaService();
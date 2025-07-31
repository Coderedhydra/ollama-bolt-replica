import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface GeminiError {
  message: string;
  code?: string;
}

export class GeminiConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'GeminiConnectionError';
  }
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Try to load API key from localStorage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      this.setApiKey(savedKey);
    }
  }

  setApiKey(apiKey: string): void {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty');
    }

    this.apiKey = apiKey.trim();
    localStorage.setItem('gemini_api_key', this.apiKey);
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }

  clearApiKey(): void {
    this.apiKey = null;
    this.genAI = null;
    this.model = null;
    localStorage.removeItem('gemini_api_key');
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  async generateContent(prompt: string, context?: string): Promise<string> {
    if (!this.model) {
      throw new GeminiConnectionError('Gemini API key not set. Please configure your API key first.');
    }

    try {
      const fullPrompt = context 
        ? `Context: ${context}\n\nUser Request: ${prompt}`
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (error: any) {
      if (error.message?.includes('API key')) {
        throw new GeminiConnectionError('Invalid API key. Please check your Gemini API key.');
      }
      if (error.message?.includes('quota')) {
        throw new GeminiConnectionError('API quota exceeded. Please check your Gemini API usage.');
      }
      if (error.message?.includes('blocked')) {
        throw new GeminiConnectionError('Content was blocked by safety filters. Try rephrasing your request.');
      }
      throw new GeminiConnectionError(`Gemini API error: ${error.message}`, error);
    }
  }

  async generateCode(
    description: string, 
    fileType: string = 'tsx',
    existingCode?: string
  ): Promise<string> {
    const codePrompt = `
Generate ${fileType} code for: ${description}

${existingCode ? `Existing code to modify:\n\`\`\`${fileType}\n${existingCode}\n\`\`\`` : ''}

Requirements:
- Write clean, modern ${fileType} code
- Use TypeScript if applicable
- Include proper imports
- Add comments for complex logic
- Follow React best practices if it's a React component
- Use Tailwind CSS for styling
- Make it responsive and accessible

Return only the code without explanations:`;

    const response = await this.generateContent(codePrompt);
    
    // Extract code from markdown blocks if present
    const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : response;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.hasApiKey()) {
      return false;
    }

    try {
      await this.generateContent('Test');
      return true;
    } catch {
      return false;
    }
  }
}

export const geminiService = new GeminiService();
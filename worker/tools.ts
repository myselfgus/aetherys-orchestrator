import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult;
interface SerpApiResponse {
  knowledge_graph?: { title?: string; description?: string; source?: { link?: string } };
  answer_box?: { answer?: string; snippet?: string; title?: string; link?: string };
  organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  local_results?: Array<{ title?: string; address?: string; phone?: string; rating?: number }>;
  error?: string;
}
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string', description: 'The city or location name' } },
        required: ['location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web using Google or fetch content from a specific URL',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for Google search' },
          url: { type: 'string', description: 'Specific URL to fetch content from (alternative to search)' },
          num_results: { type: 'number', description: 'Number of search results to return (default: 5, max: 10)', default: 5 }
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
        name: 'deploy_worker',
        description: 'Deploys a new Cloudflare Worker or updates an existing one. Generates an artifact for the user to review.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'The name of the worker script.' },
                code: { type: 'string', description: 'The JavaScript/TypeScript code for the worker.' },
                language: { type: 'string', enum: ['javascript', 'typescript'], description: 'The language of the code provided.' }
            },
            required: ['name', 'code', 'language']
        }
    }
  },
  {
    type: 'function' as const,
    function: {
        name: 'manage_r2_file',
        description: 'Uploads, retrieves, or deletes a file from a simulated R2 bucket for the current session.',
        parameters: {
            type: 'object',
            properties: {
                operation: { type: 'string', enum: ['upload', 'get', 'delete'], description: 'The file operation to perform.' },
                filename: { type: 'string', description: 'The name of the file to manage.' },
                content: { type: 'string', description: 'The content of the file to upload (required for upload operation).' }
            },
            required: ['operation', 'filename']
        }
    }
  },
  {
    type: 'function' as const,
    function: {
        name: 'search_knowledge_base',
        description: 'Performs a semantic search on files uploaded to the R2 context for this session.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The natural language query to search for.' }
            },
            required: ['query']
        }
    }
  }
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
const createSearchUrl = (query: string, apiKey: string, numResults: number) => {
  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('num', Math.min(numResults, 10).toString());
  return url.toString();
};
const formatSearchResults = (data: SerpApiResponse, query: string, numResults: number): string => {
  const results: string[] = [];
  if (data.knowledge_graph?.title && data.knowledge_graph.description) {
    results.push(`**${data.knowledge_graph.title}**\n${data.knowledge_graph.description}`);
    if (data.knowledge_graph.source?.link) results.push(`Source: ${data.knowledge_graph.source.link}`);
  }
  if (data.answer_box) {
    const { answer, snippet, title, link } = data.answer_box;
    if (answer) results.push(`**Answer**: ${answer}`);
    else if (snippet) results.push(`**${title || 'Answer'}**: ${snippet}`);
    if (link) results.push(`Source: ${link}`);
  }
  if (data.organic_results?.length) {
    results.push('\n**Search Results:**');
    data.organic_results.slice(0, numResults).forEach((result, index) => {
      if (result.title && result.link) {
        const text = [`${index + 1}. **${result.title}**`];
        if (result.snippet) text.push(`   ${result.snippet}`);
        text.push(`   Link: ${result.link}`);
        results.push(text.join('\n'));
      }
    });
  }
  return results.length ? `🔍 Search results for "${query}":\n\n${results.join('\n\n')}`
    : `No results found for "${query}". Try: https://www.google.com/search?q=${encodeURIComponent(query)}`;
};
async function performWebSearch(query: string, numResults = 5): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return `🔍 Web search requires SerpAPI key. Get one at https://serpapi.com/\nFallback: https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
  try {
    const response = await fetch(createSearchUrl(query, apiKey, numResults));
    if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
    const data: SerpApiResponse = await response.json();
    if (data.error) throw new Error(`SerpAPI error: ${data.error}`);
    return formatSearchResults(data, query, numResults);
  } catch (error) {
    return `Search failed. Try: https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}
const extractTextFromHtml = (html: string): string => html
  .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
async function fetchWebContent(url: string): Promise<string> {
  try {
    new URL(url);
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebBot/1.0)' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/')) throw new Error('Unsupported content type');
    const html = await response.text();
    const text = extractTextFromHtml(html);
    return text.length ? `Content from ${url}:\n\n${text.slice(0, 4000)}${text.length > 4000 ? '...' : ''}`
      : `No readable content found at ${url}`;
  } catch (error) {
    throw new Error(`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'get_weather':
        return {
          location: args.location as string,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 100)
        };
      case 'web_search': {
        const { query, url, num_results = 5 } = args;
        if (typeof url === 'string') return { content: await fetchWebContent(url) };
        if (typeof query === 'string') return { content: await performWebSearch(query, num_results as number) };
        return { error: 'Either query or url parameter is required' };
      }
      case 'deploy_worker': {
        const { name, code, language } = args as { name: string, code: string, language: string };
        const artifact = "```" + `artifact:${language}\n${code}\n` + "```";
        return { content: `(Simulation) Worker '${name}' deployment prepared. The code is available as an artifact for review. Once approved, it can be deployed to the Cloudflare network. ${artifact}` };
      }
      case 'manage_r2_file': {
        const { operation, filename, content } = args as { operation: string, filename: string, content?: string };
        switch (operation) {
            case 'upload':
                if (!content) return { error: 'Content is required for upload operation.' };
                return { content: `(Simulation) File '${filename}' uploaded to session R2 context.` };
            case 'get':
                return { content: `(Simulation) Retrieved content for '${filename}': "This is simulated file content."` };
            case 'delete':
                return { content: `(Simulation) File '${filename}' deleted from session R2 context.` };
            default:
                return { error: `Invalid operation: ${operation}` };
        }
      }
      case 'search_knowledge_base': {
        const { query } = args as { query: string };
        return { content: `(Simulation) Search results for "${query}":\n1. Document snippet about '${query}'.\n2. Another relevant piece of information.` };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
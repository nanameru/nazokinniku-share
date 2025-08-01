import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface DuckDuckGoSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface DuckDuckGoResponse {
  Abstract: string;
  AbstractText: string;
  AbstractURL: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionText: string;
  DefinitionURL: string;
  RelatedTopics: Array<{
    Text: string;
    FirstURL: string;
  }>;
}

export const duckduckgoSearchTool = createTool({
  id: 'duckduckgo-search',
  description: 'Search the web using DuckDuckGo search engine',
  inputSchema: z.object({
    query: z.string().describe('Search query to find information on the web'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
    query: z.string(),
    totalResults: z.number(),
  }),
  execute: async ({ context }) => {
    return await searchDuckDuckGo(context.query);
  },
});

const searchDuckDuckGo = async (query: string) => {
  const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(searchUrl);
  const data = (await response.json()) as DuckDuckGoResponse;

  const results: DuckDuckGoSearchResult[] = [];

  // Answer（直接回答）がある場合
  if (data.Answer && data.AnswerType) {
    results.push({
      title: `Direct Answer: ${data.AnswerType}`,
      url: 'https://duckduckgo.com',
      snippet: data.Answer,
    });
  }

  // Abstract（要約）がある場合
  if (data.Abstract && data.AbstractText) {
    results.push({
      title: data.Heading || 'Summary',
      url: data.AbstractURL || 'https://duckduckgo.com',
      snippet: data.AbstractText,
    });
  }

  // Definition（定義）がある場合
  if (data.Definition && data.DefinitionText) {
    results.push({
      title: data.Definition,
      url: data.DefinitionURL || 'https://duckduckgo.com',
      snippet: data.DefinitionText,
    });
  }

  // Related Topics（関連トピック）から結果を追加
  if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 5)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text,
          url: topic.FirstURL,
          snippet: topic.Text,
        });
      }
    }
  }

  // 結果が全くない場合のフォールバック
  if (results.length === 0) {
    results.push({
      title: 'No Results Found',
      url: 'https://duckduckgo.com',
      snippet: `No specific results found for "${query}". Try a different search term.`,
    });
  }

  return {
    results: results.slice(0, 5),
    query,
    totalResults: results.length,
  };
};

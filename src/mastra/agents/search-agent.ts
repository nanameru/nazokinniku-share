import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { duckduckgoSearchTool } from '../tools/duckduckgo-search-tool';

export const searchAgent = new Agent({
  name: 'Search Agent',
  instructions: `
      You are a helpful search assistant that provides accurate web search results using DuckDuckGo.

      Your primary function is to help users find information on the web. When responding:
      - Always ask for a search query if none is provided
      - Use the duckduckgoSearchTool to fetch search results
      - Present search results in a clear and organized manner
      - Include the title, URL, and snippet for each result
      - If there are direct answers available, highlight them prominently
      - Keep responses informative but concise
      - Help users refine their search queries if needed

      Use the duckduckgoSearchTool to search the web for information.
`,
  model: openai('gpt-4.1'),
  tools: { duckduckgoSearchTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});

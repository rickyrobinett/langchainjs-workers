/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains";

export default {
    async fetch(request, env, ctx) {
        const loader = new CheerioWebBaseLoader(
            "https://en.wikipedia.org/wiki/Brooklyn"
        );
        const docs = await loader.loadAndSplit();
        console.log(docs);

        const store = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY}));

        const model = new OpenAI({ openAIApiKey: env.OPENAI_API_KEY });
        const chain = RetrievalQAChain.fromLLM(model, store.asRetriever());

        const { searchParams } = new URL(request.url);
        const question = searchParams.get('question') ?? "What is this article about? Can you give me 3 facts about it?";

        const res = await chain.call({
            query: question,
        });
        console.log(res.text);

        return new Response(res.text); 
    },
};


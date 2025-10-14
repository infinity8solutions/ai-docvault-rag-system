/**
 * ChromaDB Client Service for MCP Server
 *
 * Provides functions to connect to the ChromaDB server and access
 * the knowledge_base collection for semantic search.
 */

import { ChromaClient, IEmbeddingFunction } from "chromadb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

/**
 * Google Generative AI Embedding Function
 * Uses the same embedding model as the API server
 */
class GoogleEmbeddingFunction implements IEmbeddingFunction {
    private genAI: GoogleGenerativeAI;
    private model = "text-embedding-004";

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generate(texts: string[]): Promise<number[][]> {
        const model = this.genAI.getGenerativeModel({ model: this.model });

        const embeddings = await Promise.all(
            texts.map(async (text) => {
                const result = await model.embedContent(text);
                return result.embedding.values;
            })
        );

        return embeddings;
    }
}

/**
 * Get ChromaDB client instance
 * Connects to the ChromaDB server via HTTP
 */
export async function getChromaClient(): Promise<ChromaClient> {
    const host = process.env.CHROMADB_HOST || 'localhost';
    const port = parseInt(process.env.CHROMADB_PORT || '8001');

    try {
        // Use host/port instead of deprecated 'path' parameter
        const client = new ChromaClient({
            host,
            port
        });

        // Test connection
        await client.heartbeat();

        return client;
    } catch (error) {
        throw new Error(
            `Failed to connect to ChromaDB at http://${host}:${port}. ` +
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Get the knowledge_base collection
 * This collection contains all document chunks with embeddings
 */
export async function getKnowledgeBaseCollection() {
    try {
        const client = await getChromaClient();

        // Use Google embeddings - same as the API server
        const googleApiKey = process.env.GOOGLE_API_KEY;
        if (!googleApiKey) {
            throw new Error('GOOGLE_API_KEY environment variable is not set');
        }

        const embeddingFunction = new GoogleEmbeddingFunction(googleApiKey);

        // Get the existing collection (created by API server)
        const collection = await client.getCollection({
            name: "contextual_kb_documents",
            embeddingFunction: embeddingFunction
        });

        return collection;
    } catch (error) {
        throw new Error(
            `Failed to get knowledge_base collection. ` +
            `Make sure documents have been uploaded via the API. ` +
            `Error: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Test ChromaDB connection
 * Useful for debugging and health checks
 */
export async function testConnection(): Promise<{
    success: boolean;
    message: string;
    collectionCount?: number;
}> {
    try {
        const client = await getChromaClient();
        const collection = await getKnowledgeBaseCollection();
        const count = await collection.count();

        return {
            success: true,
            message: 'ChromaDB connection successful',
            collectionCount: count
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : String(error)
        };
    }
}

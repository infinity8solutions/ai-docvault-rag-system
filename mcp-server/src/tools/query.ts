/**
 * Query Knowledge Base Tool
 *
 * Implements semantic search over the document chunks stored in ChromaDB.
 * Follows MCP SDK patterns for tool registration.
 */

import { z } from 'zod';
import { getKnowledgeBaseCollection } from '../services/chromadb.js';

/**
 * Tool configuration following MCP SDK patterns
 * Input and output schemas defined with Zod
 */
export const queryKnowledgeBaseToolConfig = {
    name: 'query_knowledge_base',
    title: 'Query Knowledge Base',
    description: 'Search the knowledge base for relevant information using semantic search. ' +
                'Returns document chunks with metadata and relevance scores.',
    inputSchema: {
        query: z.string()
            .min(1)
            .describe("The search query or question to find relevant documents"),
        project_name: z.string()
            .optional()
            .describe("Optional: Filter results to a specific project name"),
        limit: z.number()
            .int()
            .positive()
            .max(20)
            .default(5)
            .describe("Number of results to return (default: 5, max: 20)")
    },
    outputSchema: {
        query: z.string(),
        result_count: z.number(),
        results: z.array(z.object({
            text: z.string(),
            metadata: z.object({
                document_id: z.string(),
                filename: z.string(),
                user_id: z.string(),
                project_id: z.string()
            }).passthrough(),  // Allow additional properties beyond the defined ones
            relevance_score: z.number()
        }))
    }
};

/**
 * Query the knowledge base
 *
 * @param query - Search query or question
 * @param project_name - Optional project name to filter results
 * @param limit - Number of results to return (default 5, max 20)
 * @returns Formatted results with text, metadata, and relevance scores
 */
export async function queryKnowledgeBase(
    query: string,
    project_name?: string,
    limit: number = 5
) {
    try {
        // Get the knowledge base collection
        const collection = await getKnowledgeBaseCollection();

        // Prepare query parameters
        const queryParams: any = {
            queryTexts: [query],  // ChromaDB will auto-embed this using the collection's embedding function
            nResults: Math.min(Math.max(1, limit), 20)  // Clamp between 1 and 20
        };

        // Add project filter if specified
        if (project_name) {
            queryParams.where = { project_name };
        }

        // Execute semantic search
        const results = await collection.query(queryParams);

        // Format results for AI agent
        const formattedResults = {
            query,
            result_count: results.documents[0]?.length || 0,
            results: (results.documents[0] || []).map((doc: any, i: number) => {
                const distance = results.distances?.[0]?.[i];
                const rawMetadata = results.metadatas?.[0]?.[i] || {};

                // Ensure required fields are present with defaults, keep other fields
                const metadata = {
                    document_id: rawMetadata.document_id || `unknown_${i}`,
                    filename: rawMetadata.filename || 'Unknown',
                    user_id: rawMetadata.user_id || 'unknown',
                    project_id: rawMetadata.project_id || 'unknown',
                    ...rawMetadata  // Include any additional fields from ChromaDB
                };

                return {
                    text: doc,
                    metadata,
                    // Convert distance to relevance score (0-1, higher is more relevant)
                    // ChromaDB returns distances, where smaller = more similar
                    relevance_score: distance !== undefined && distance !== null
                        ? Math.max(0, 1 - distance)
                        : 0
                };
            })
        };

        return formattedResults;

    } catch (error) {
        // Provide helpful error message
        const errorMessage = error instanceof Error ? error.message : String(error);

        throw new Error(
            `Failed to query knowledge base: ${errorMessage}. ` +
            `Make sure ChromaDB server is running and documents have been uploaded.`
        );
    }
}

/**
 * Validate query parameters
 * Helps catch errors early before querying
 */
export function validateQueryParams(
    query: string,
    project_name?: string,
    limit?: number
): { valid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
        return { valid: false, error: 'Query cannot be empty' };
    }

    if (limit !== undefined && (limit < 1 || limit > 20)) {
        return { valid: false, error: 'Limit must be between 1 and 20' };
    }

    if (project_name !== undefined && project_name.trim().length === 0) {
        return { valid: false, error: 'Project name cannot be empty if provided' };
    }

    return { valid: true };
}

/**
 * Contextual Knowledge Base MCP Server
 *
 * Exposes the ChromaDB knowledge base to AI agents via the Model Context Protocol.
 * Implements StreamableHTTP transport following MCP SDK patterns from docs/mcp-typescript-sdk.md
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { queryKnowledgeBaseToolConfig, queryKnowledgeBase, validateQueryParams } from './tools/query.js';
import { testConnection } from './services/chromadb.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

/**
 * Initialize MCP Server
 * Following the pattern from docs/mcp-typescript-sdk.md
 */
const serverInfo = {
    name: 'contextual-kb-server',
    version: '1.0.0'
};

const server = new McpServer(serverInfo);

// Log server information
console.log('Initializing Contextual Knowledge Base MCP Server...');
console.log(`Server: ${serverInfo.name} v${serverInfo.version}`);

/**
 * Register the query_knowledge_base tool
 * Following MCP SDK tool registration pattern
 */
server.registerTool(
    queryKnowledgeBaseToolConfig.name,
    {
        title: queryKnowledgeBaseToolConfig.title,
        description: queryKnowledgeBaseToolConfig.description,
        inputSchema: queryKnowledgeBaseToolConfig.inputSchema,
        outputSchema: queryKnowledgeBaseToolConfig.outputSchema
    },
    async ({ query, project_name, limit = 5 }) => {
        try {
            // Validate parameters
            const validation = validateQueryParams(query, project_name, limit);
            if (!validation.valid) {
                throw new Error(`Invalid parameters: ${validation.error}`);
            }

            // Log query
            console.log(`[Query] "${query}" | Project: ${project_name || 'all'} | Limit: ${limit}`);

            // Execute query
            const output = await queryKnowledgeBase(query, project_name, limit);

            // Log results
            console.log(`[Results] Found ${output.result_count} results`);

            // Return results in MCP format
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(output, null, 2)
                    }
                ],
                structuredContent: output
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Error] Query failed: ${errorMessage}`);

            // Return error in MCP format
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: true,
                            message: errorMessage
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }
    }
);

console.log(`Registered tool: ${queryKnowledgeBaseToolConfig.name}`);

/**
 * Set up Express server with StreamableHTTP transport
 * Following the pattern from docs/mcp-typescript-sdk.md
 */
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
    const status = await testConnection();
    res.json({
        server: 'contextual-kb-mcp-server',
        version: '1.0.0',
        chromadb: status
    });
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
    try {
        // Create a new transport for each request to prevent request ID collisions
        // This is important as per MCP SDK documentation
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });

        // Clean up transport when response closes
        res.on('close', () => {
            transport.close();
        });

        // Connect server to transport and handle request
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

    } catch (error) {
        console.error('[MCP Endpoint Error]', error);
        res.status(500).json({
            error: true,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * Start the server
 */
const port = parseInt(process.env.MCP_PORT || process.env.PORT || '3000');

app.listen(port, () => {
    console.log('\n' + '='.repeat(60));
    console.log('Contextual KB MCP Server - Ready!');
    console.log('='.repeat(60));
    console.log(`MCP Endpoint:     http://localhost:${port}/mcp`);
    console.log(`Health Check:     http://localhost:${port}/health`);
    console.log(`\nTest with MCP Inspector:`);
    console.log(`  npx @modelcontextprotocol/inspector`);
    console.log(`  Connect to: http://localhost:${port}/mcp`);
    console.log('='.repeat(60) + '\n');

    // Test ChromaDB connection on startup
    testConnection().then(result => {
        if (result.success) {
            console.log(`[ChromaDB] Connected - ${result.collectionCount} documents in knowledge base`);
        } else {
            console.warn(`[ChromaDB] Warning: ${result.message}`);
            console.warn(`Make sure ChromaDB server is running and documents have been uploaded`);
        }
    });

}).on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down MCP server...');
    process.exit(0);
});

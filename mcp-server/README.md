# Contextual Knowledge Base - MCP Server

TypeScript MCP (Model Context Protocol) server that exposes the ChromaDB knowledge base to AI agents via semantic search.

## Overview

This MCP server provides AI agents with access to your document knowledge base through the `query_knowledge_base` tool. It connects to the same ChromaDB instance used by the Django web application and performs semantic search over document chunks.

## Features

- **Semantic Search**: Query documents using natural language
- **Project Filtering**: Filter results by specific projects
- **Relevance Scoring**: Results ranked by semantic similarity
- **MCP Compatible**: Works with Claude Desktop, MCP Inspector, and other MCP clients
- **StreamableHTTP Transport**: HTTP-based transport for easy integration

## Prerequisites

- Node.js 18+ and npm
- ChromaDB server running on port 8001
- Documents uploaded via Django web app

## Installation

Dependencies are already installed during Phase 2 setup. If needed:

```bash
npm install
```

## Configuration

The server reads from the `.env` file in the project root:

```
CHROMADB_HOST=localhost
CHROMADB_PORT=8001
MCP_PORT=3000  # Optional, defaults to 3000
```

## Running the Server

### Development Mode

```cmd
npm run dev
```

Or use the startup script:

```cmd
start_mcp.bat
```

### Production Mode

```cmd
npm run build
npm start
```

The server will start on `http://localhost:3000`

## Endpoints

### MCP Endpoint

```
POST http://localhost:3000/mcp
```

Main endpoint for MCP protocol communication.

### Health Check

```
GET http://localhost:3000/health
```

Returns server status and ChromaDB connection info.

## MCP Tool: query_knowledge_base

### Description

Search the knowledge base for relevant information using semantic search.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The search query or question |
| `project_name` | string | No | Filter results to a specific project name |
| `limit` | number | No | Number of results to return (default: 5, max: 20) |

### Returns

```json
{
  "query": "search query",
  "result_count": 3,
  "results": [
    {
      "text": "document chunk text...",
      "metadata": {
        "document_id": "uuid",
        "document_name": "filename.pdf",
        "project_id": "uuid",
        "project_name": "Project Name",
        "chunk_index": 0,
        "total_chunks": 10,
        "file_type": "pdf",
        "upload_date": "2025-10-12T00:00:00Z"
      },
      "relevance_score": 0.95
    }
  ]
}
```

## Testing

### With MCP Inspector

```cmd
npx @modelcontextprotocol/inspector
```

Then connect to: `http://localhost:3000/mcp`

### With Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "contextual-kb": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Manual Testing

Check health endpoint:

```cmd
curl http://localhost:3000/health
```

## Project Structure

```
mcp_server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── tools/
│   │   └── query.ts          # query_knowledge_base tool
│   └── services/
│       └── chromadb.ts       # ChromaDB client
├── package.json              # npm configuration
├── tsconfig.json            # TypeScript config
├── start_mcp.bat            # Windows startup script
└── README.md                # This file
```

## Development

### Build

```cmd
npm run build
```

Compiles TypeScript to JavaScript in `dist/` directory.

### Type Checking

```cmd
npx tsc --noEmit
```

## Troubleshooting

### Server won't start

- **Check port availability**: Make sure port 3000 is not in use
- **Check dependencies**: Run `npm install`
- **Check Node version**: Must be 18+

### ChromaDB connection error

- **Start ChromaDB**: Run `start_chroma.bat` in project root
- **Check environment**: Verify `.env` file has correct CHROMADB_HOST and CHROMADB_PORT
- **Upload documents**: Make sure documents have been uploaded via Django app

### No results from queries

- **Upload documents first**: Use the Django web app to upload documents
- **Check collection**: Visit health endpoint to see document count
- **Try different queries**: Use more specific search terms

### MCP Inspector can't connect

- **Check URL**: Use `http://localhost:3000/mcp` (with /mcp path)
- **Server running**: Make sure `npm run dev` is running
- **Check logs**: Look for errors in server console

### Warning: "No embedding function configuration found"

This warning is **expected and safe to ignore**:

```
No embedding function configuration found for collection knowledge_base.
'add' and 'query' will fail unless you provide them embeddings directly.
[ChromaDB] Connected - 44 documents in knowledge base
```

**Why it appears**: The Node.js ChromaDB client doesn't know which embedding function was used when Django created the collection.

**Why it's not a problem**:
- The embeddings are already stored in ChromaDB (created by Django using sentence-transformers)
- Queries still work perfectly - ChromaDB automatically uses the default embedding function for query embeddings
- The document count confirms the connection is working

**What to do**: Nothing! Your queries will work normally. The warning is informational only.

## API Reference

See [MCP TypeScript SDK Documentation](../docs/mcp-typescript-sdk.md) for detailed MCP protocol information.

## License

MIT

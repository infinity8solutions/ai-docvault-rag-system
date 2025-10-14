# Contextual Knowledge Base

A full-stack RAG (Retrieval Augmented Generation) application that allows users to ingest documents (PDFs and images), store them in a vector database, and query them using natural language through an MCP (Model Context Protocol) server.

## 🤖 AI Agent Integration

**Any AI agent can now connect to our MCP server and query the knowledge base!**

The MCP (Model Context Protocol) server exposes a standardized interface that allows any MCP-compatible AI agent (Claude Desktop, Cline, Roo-Cline, custom agents, etc.) to:
- Query your ingested documents using natural language
- Retrieve relevant context from your knowledge base
- Filter results by project and user
- Access structured metadata with relevance scores

Simply configure your AI agent to connect to `http://localhost:3000` and start querying your knowledge base!

### Supported AI Agents
- **Claude Desktop** - Anthropic's desktop application with MCP support
- **Cline** - VS Code extension for AI-powered development
- **Roo-Cline** - Enhanced Cline fork with additional features
- **Custom MCP Clients** - Any client implementing the MCP protocol

### Example MCP Query
```json
{
  "tool": "query_knowledge_base",
  "arguments": {
    "query": "What are the main requirements for the authentication feature?",
    "project_id": "2",
    "limit": 10
  }
}
```

### MCP Server Connection Diagram

```mermaid
graph LR
    subgraph "AI Agents"
        CLAUDE[Claude Desktop]
        CLINE[Cline/Roo-Cline]
        CUSTOM[Custom MCP Client]
    end

    subgraph "MCP Server"
        MCP[MCP Server<br/>localhost:3000]
    end

    subgraph "Knowledge Base"
        CHROMA[(ChromaDB<br/>Vector Store)]
    end

    CLAUDE -->|MCP Protocol| MCP
    CLINE -->|MCP Protocol| MCP
    CUSTOM -->|MCP Protocol| MCP
    MCP -->|Query & Retrieve| CHROMA
```

## Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js UI<br/>Port: 3001]
    end

    subgraph "AI Agents"
        CLAUDE[Claude Desktop]
        CLINE[Cline/Roo-Cline]
        CUSTOM[Custom MCP Client]
    end

    subgraph "API Layer"
        API[Fastify API<br/>Port: 5001]
    end

    subgraph "MCP Layer"
        MCP[MCP Server<br/>Port: 3000]
    end

    subgraph "Storage Layer"
        PG[(PostgreSQL<br/>Port: 5432)]
        CHROMA[(ChromaDB<br/>Port: 8000)]
    end

    subgraph "External Services"
        GOOGLE[Google Generative AI<br/>text-embedding-004]
        OPENROUTER[OpenRouter<br/>Mistral Pixtral]
    end

    UI -->|HTTP/REST| API
    CLAUDE -->|MCP Protocol| MCP
    CLINE -->|MCP Protocol| MCP
    CUSTOM -->|MCP Protocol| MCP
    API -->|SQL| PG
    API -->|Vector Operations| CHROMA
    API -->|Generate Embeddings| GOOGLE
    API -->|Extract Image Text| OPENROUTER
    MCP -->|Query Vectors| CHROMA
    MCP -->|Generate Embeddings| GOOGLE
```

## System Components

### 1. **Next.js UI** (Port: 3001)
- User authentication (login/register)
- Project management
- Document upload and management
- Document ingestion trigger
- Real-time status updates

### 2. **Fastify API** (Port: 5001)
- RESTful API endpoints
- User authentication (JWT)
- Project CRUD operations
- Document upload and storage
- Document ingestion pipeline
- PostgreSQL database integration

### 3. **MCP Server** (Port: 3000)
- Model Context Protocol implementation
- Knowledge base querying
- Vector similarity search
- Context-aware responses

### 4. **PostgreSQL** (Port: 5432)
- User data storage
- Project metadata
- Document metadata
- Ingestion status tracking

### 5. **ChromaDB** (Port: 8000)
- Vector database
- Document embeddings storage
- Similarity search
- Metadata filtering

## Document Ingestion Flow

### PDF Ingestion

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant PG as PostgreSQL
    participant Google as Google AI
    participant Chroma as ChromaDB

    User->>UI: Upload PDF file
    UI->>API: POST /api/document/upload/:projectId
    API->>API: Validate file type & size
    API->>API: Save file to uploads/userId/projectId/
    API->>PG: Create document record (status: pending)
    API->>UI: Return document metadata

    User->>UI: Click "Ingest into Vector Store"
    UI->>API: POST /api/document/:id/ingest
    API->>API: Load PDF with PDFLoader
    API->>API: Split into chunks (1000 chars, 200 overlap)
    API->>API: Sanitize metadata

    loop For each chunk
        API->>Google: Generate embedding (text-embedding-004)
        Google->>API: Return embedding vector
        API->>Chroma: Store chunk + embedding + metadata
    end

    API->>PG: Update status to 'ingested'
    API->>UI: Success response
    UI->>User: Show "Ingested" badge
```

### Image Ingestion

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant PG as PostgreSQL
    participant OpenRouter
    participant Google as Google AI
    participant Chroma as ChromaDB

    User->>UI: Upload Image (PNG/JPEG/JPG)
    UI->>API: POST /api/document/upload/:projectId
    API->>API: Validate file type & size
    API->>API: Save file to uploads/userId/projectId/
    API->>PG: Create document record (status: pending)
    API->>UI: Return document metadata

    User->>UI: Click "Ingest into Vector Store"
    UI->>API: POST /api/document/:id/ingest
    API->>API: Read image as base64
    API->>OpenRouter: Extract text using Mistral Pixtral
    OpenRouter->>API: Return extracted text
    API->>API: Split text into chunks (1000 chars, 200 overlap)
    API->>API: Sanitize metadata

    loop For each chunk
        API->>Google: Generate embedding (text-embedding-004)
        Google->>API: Return embedding vector
        API->>Chroma: Store chunk + embedding + metadata
    end

    API->>PG: Update status to 'ingested'
    API->>UI: Success response
    UI->>User: Show "Ingested" badge
```

## Query Flow via MCP Server

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant MCP as MCP Server
    participant Google as Google AI
    participant Chroma as ChromaDB

    Client->>MCP: query_knowledge_base(query, project_id, limit)
    MCP->>MCP: Validate parameters

    MCP->>Google: Generate query embedding (text-embedding-004)
    Google->>MCP: Return query vector

    MCP->>Chroma: Query with filters (project_id, user_id)
    Chroma->>Chroma: Calculate similarity scores
    Chroma->>MCP: Return top N results + metadata

    MCP->>MCP: Format results with relevance scores
    MCP->>Client: Return structured results

    Note over Client,Chroma: Results include: text, metadata, relevance_score
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Input"
        PDF[PDF Documents]
        IMG[Images]
    end

    subgraph "Processing"
        LOAD[Load Document]
        EXTRACT[Extract Text]
        SPLIT[Split into Chunks]
        SANITIZE[Sanitize Metadata]
    end

    subgraph "Embedding"
        EMBED[Generate Embeddings<br/>Google text-embedding-004]
    end

    subgraph "Storage"
        META[(PostgreSQL<br/>Metadata)]
        VEC[(ChromaDB<br/>Vectors)]
    end

    subgraph "Retrieval"
        QUERY[User Query]
        QEMBED[Query Embedding]
        SEARCH[Similarity Search]
        RESULTS[Ranked Results]
    end

    PDF --> LOAD
    IMG --> EXTRACT
    EXTRACT --> SPLIT
    LOAD --> SPLIT
    SPLIT --> SANITIZE
    SANITIZE --> EMBED
    EMBED --> META
    EMBED --> VEC

    QUERY --> QEMBED
    QEMBED --> SEARCH
    VEC --> SEARCH
    META --> SEARCH
    SEARCH --> RESULTS
```

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend
- **Fastify** - High-performance Node.js web framework
- **Prisma** - Type-safe ORM for PostgreSQL
- **TypeScript** - Type-safe development

### RAG Pipeline
- **LangChain** - Document processing and vector operations
- **Google Generative AI** - Embeddings generation (text-embedding-004)
- **OpenRouter AI** - Image text extraction (Mistral Pixtral 12B)
- **ChromaDB** - Vector database for embeddings storage

### MCP Server
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **Zod** - Schema validation
- **Google Generative AI** - Custom embedding function

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Relational database
- **ChromaDB** - Vector database

## Database Schema

### PostgreSQL Tables

```mermaid
erDiagram
    User ||--o{ Project : creates
    User ||--o{ Document : uploads
    Project ||--o{ Document : contains

    User {
        int id PK
        string email UK
        string password
        string name
        timestamp created_at
        timestamp updated_at
    }

    Project {
        int id PK
        int user_id FK
        string name
        text description
        timestamp created_at
        timestamp updated_at
    }

    Document {
        int id PK
        int project_id FK
        int user_id FK
        string filename
        string original_filename
        string file_type
        bigint file_size
        string mime_type
        string storage_path
        string ingestion_status
        timestamp created_at
        timestamp updated_at
    }
```

### ChromaDB Collections

**Collection Name**: `contextual_kb_documents`

**Stored Data**:
- **Embeddings**: 768-dimensional vectors from Google text-embedding-004
- **Documents**: Text chunks from ingested files
- **Metadata**:
  - `document_id`: Reference to PostgreSQL document
  - `user_id`: Owner of the document
  - `project_id`: Project association
  - `filename`: Original filename
  - Additional metadata from document processing (page numbers, etc.)

## API Endpoints

### Authentication
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `GET /api/user/me` - Get current user

### Projects
- `POST /api/project` - Create project
- `GET /api/project` - Get user's projects
- `GET /api/project/:id` - Get project by ID
- `PUT /api/project/:id` - Update project
- `DELETE /api/project/:id` - Delete project

### Documents
- `POST /api/document/upload/:projectId` - Upload document
- `GET /api/document/project/:projectId` - Get project documents
- `GET /api/document/:id` - Get document by ID
- `GET /api/document/:id/download` - Download document
- `DELETE /api/document/:id` - Delete document
- `POST /api/document/:id/ingest` - Ingest document into vector store

### MCP Tools
- `query_knowledge_base` - Query ingested documents with natural language

## Environment Variables

### API Service (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/contextual_kb

# JWT
JWT_SECRET=your-secret-key

# Google AI
GOOGLE_API_KEY=your-google-api-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key

# ChromaDB
CHROMADB_URL=http://chromadb:8000
CHROMADB_COLLECTION_NAME=contextual_kb_documents
```

### UI Service (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### MCP Server (.env)
```bash
PORT=3000
MCP_PORT=3000
CHROMADB_HOST=chromadb
CHROMADB_PORT=8000
GOOGLE_API_KEY=your-google-api-key
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Google API Key (for embeddings)
- OpenRouter API Key (for image processing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd contextual-knowledge-base
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec api npx prisma migrate deploy
```

5. **Access the application**
- UI: http://localhost:3001
- API: http://localhost:5001
- MCP Server: http://localhost:3000
- ChromaDB: http://localhost:8000
- PostgreSQL: localhost:5432

### Connecting AI Agents to MCP Server

#### Claude Desktop Configuration

Add to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "contextual-kb": {
      "command": "node",
      "args": ["/path/to/contextual-knowledge-base/mcp-server/build/index.js"],
      "env": {
        "CHROMADB_HOST": "localhost",
        "CHROMADB_PORT": "8000",
        "GOOGLE_API_KEY": "your-google-api-key"
      }
    }
  }
}
```

#### Cline/Roo-Cline Configuration

In VS Code settings (`settings.json`):

```json
{
  "cline.mcpServers": {
    "contextual-kb": {
      "command": "node",
      "args": ["/path/to/contextual-knowledge-base/mcp-server/build/index.js"],
      "env": {
        "CHROMADB_HOST": "localhost",
        "CHROMADB_PORT": "8000",
        "GOOGLE_API_KEY": "your-google-api-key"
      }
    }
  }
}
```

#### Custom MCP Client (Node.js Example)

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/path/to/contextual-knowledge-base/mcp-server/build/index.js'],
  env: {
    CHROMADB_HOST: 'localhost',
    CHROMADB_PORT: '8000',
    GOOGLE_API_KEY: 'your-google-api-key'
  }
});

const client = new Client({
  name: 'my-mcp-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// Query the knowledge base
const result = await client.callTool({
  name: 'query_knowledge_base',
  arguments: {
    query: 'What are the project requirements?',
    project_id: '2',
    user_id: '1',
    limit: 10
  }
});

console.log(result);
```

## Usage Workflow

### 1. User Registration & Login
```mermaid
graph LR
    A[Visit UI] --> B[Register Account]
    B --> C[Login]
    C --> D[Dashboard]
```

### 2. Project Creation
```mermaid
graph LR
    A[Dashboard] --> B[Create Project]
    B --> C[Enter Name & Description]
    C --> D[Save Project]
```

### 3. Document Upload & Ingestion
```mermaid
graph LR
    A[Select Project] --> B[Upload PDF/Image]
    B --> C[File Saved - Status: Pending]
    C --> D[Click Ingest Button]
    D --> E[Processing...]
    E --> F[Status: Ingested]
```

### 4. Querying via MCP
```mermaid
graph LR
    A[MCP Client] --> B[Send Query]
    B --> C[Search Vector DB]
    C --> D[Return Relevant Chunks]
    D --> E[Use in LLM Context]
```

## Supported File Types

### Documents
- PDF (`.pdf`) - Ingestion: ✅

### Images
- PNG (`.png`) - Ingestion: ✅
- JPEG/JPG (`.jpeg`, `.jpg`) - Ingestion: ✅
- GIF (`.gif`) - Upload only
- WebP (`.webp`) - Upload only

### Future Support
- Word Documents (`.doc`, `.docx`)
- Plain Text (`.txt`)
- Markdown (`.md`)

## Key Features

### AI Agent Integration (MCP)
- **Universal Compatibility**: Any MCP-compatible AI agent can connect
- **Standardized Protocol**: Model Context Protocol (MCP) implementation
- **Real-time Querying**: Natural language queries to your knowledge base
- **Context Enrichment**: AI agents get relevant context from your documents
- **Multi-Agent Support**: Claude Desktop, Cline, Roo-Cline, and custom clients

### Document Processing
- **PDF Text Extraction**: Uses LangChain's PDFLoader
- **Image Text Extraction**: Uses Mistral Pixtral 12B vision model
- **Chunking Strategy**: 1000 characters with 200 character overlap
- **Metadata Sanitization**: Ensures ChromaDB compatibility

### Vector Search
- **Embedding Model**: Google text-embedding-004 (768 dimensions)
- **Similarity Metric**: Cosine similarity
- **Filtering**: By user_id and project_id
- **Relevance Scoring**: Distance-based (1 - distance)

### Security
- **JWT Authentication**: Secure token-based auth
- **User Isolation**: Documents scoped to users
- **Project Isolation**: Queries scoped to projects
- **File Validation**: Type and size checks

## Performance Considerations

### Embedding Generation
- **Batch Processing**: Chunks processed in parallel where possible
- **Rate Limiting**: Respects Google AI API limits
- **Caching**: ChromaDB provides built-in vector caching

### Query Performance
- **Vector Index**: ChromaDB uses HNSW algorithm
- **Metadata Filtering**: Pre-filters by user_id and project_id
- **Result Limiting**: Configurable result count (default: 10)

### Storage
- **File System**: Documents stored in `uploads/` directory
- **PostgreSQL**: Metadata and relationships
- **ChromaDB**: Vectors and document chunks

## Development

### Local Development (without Docker)

**API**:
```bash
cd api
npm install
npm run dev
```

**UI**:
```bash
cd ui
npm install
npm run dev
```

**MCP Server**:
```bash
cd mcp-server
npm install
npm run dev
```

### Database Management

**Run migrations**:
```bash
cd api
npx prisma migrate dev
```

**Generate Prisma Client**:
```bash
npx prisma generate
```

**View database**:
```bash
npx prisma studio
```

## Troubleshooting

### Common Issues

**1. ChromaDB Connection Failed**
- Ensure ChromaDB container is running: `docker-compose ps`
- Check ChromaDB logs: `docker-compose logs chromadb`

**2. MCP Server ONNX Error**
- Fixed by using full `node:20` image instead of `node:20-slim`
- Provides required system libraries for native modules

**3. Metadata Validation Errors**
- Ensure metadata only contains strings, numbers, and booleans
- Use `.passthrough()` in Zod schemas for flexible metadata

**4. Embedding Mismatch**
- Both API and MCP server must use same embedding model
- Currently: Google text-embedding-004

## Future Enhancements

- [ ] Support for more document types (Word, TXT, Markdown)
- [ ] Bulk document upload
- [ ] Document versioning
- [ ] Advanced search filters
- [ ] Multi-language support
- [ ] Document preview
- [ ] Collaborative projects
- [ ] API rate limiting
- [ ] Monitoring and analytics
- [ ] Automated tests

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ using Next.js, Fastify, and ChromaDB

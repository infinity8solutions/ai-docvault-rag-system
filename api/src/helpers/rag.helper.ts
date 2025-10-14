import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { generateText } from 'ai';
import fs from 'fs/promises';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * Ingests a PDF file into ChromaDB vector store
 * @param pdfPath - Absolute path to the PDF file
 * @param metadata - Optional metadata to attach to the document
 * @returns Promise<void>
 */

export const IngestPdf = async (
    pdfPath: string,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        console.log(`Starting PDF ingestion for: ${pdfPath}`);

        // Load PDF
        const loader = new PDFLoader(pdfPath);
        const docs = await loader.load();
        console.log(`Loaded ${docs.length} pages from PDF`);

        // Split documents into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        console.log(`Split into ${splitDocs.length} chunks`);

        // Sanitize metadata for ChromaDB - only string, number, boolean allowed
        // Remove any complex objects, arrays, or undefined values
        const sanitizeMetadata = (meta: Record<string, any>): Record<string, string | number | boolean> => {
            const sanitized: Record<string, string | number | boolean> = {};
            for (const [key, value] of Object.entries(meta)) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                } else if (value !== null && value !== undefined) {
                    // Convert other types to string
                    sanitized[key] = String(value);
                }
            }
            return sanitized;
        };

        // Add custom metadata to all documents with sanitization
        if (metadata) {
            splitDocs.forEach(doc => {
                doc.metadata = sanitizeMetadata({ ...doc.metadata, ...metadata });
            });
        } else {
            // Still need to sanitize existing metadata from PDF loader
            splitDocs.forEach(doc => {
                doc.metadata = sanitizeMetadata(doc.metadata);
            });
        }

        // Initialize Google Generative AI embeddings (free to use)
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004", // 768 dimensions
            apiKey: process.env.GOOGLE_API_KEY,
            taskType: TaskType.RETRIEVAL_DOCUMENT,
        });


        const vectorStore = new Chroma(embeddings, {
            collectionName: process.env.CHROMADB_COLLECTION_NAME || 'contextual_kb_documents',
            url: process.env.CHROMADB_URL || 'http://chromadb:8000',
        });

        // Initialize Chroma vectorstore with ChromaDB URL

        await vectorStore.addDocuments(splitDocs)

        console.log(`Successfully ingested PDF into ChromaDB collection: ${process.env.CHROMADB_COLLECTION_NAME}`);
    } catch (error) {
        console.error('Error ingesting PDF:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw new Error(`Failed to ingest PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const IngestImage = async (
    imagePath: string,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        console.log(`Starting image ingestion for: ${imagePath}`);

        // Load image from upload folder and convert to base64
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

        const openrouter = createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
        });

        // Extract information from the image using vision model
        const { text } = await generateText({
            model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'Extract all information from this image. It may contain requirements for a project, discussions with clients from platforms like Upwork, Discord, Slack, etc. Provide a detailed response with all relevant information.'
                    },
                    {
                        type: 'image',
                        image: `data:${mimeType};base64,${base64Image}`
                    }
                ]
            }]
        });

        console.log(`Extracted text from image (${text.length} characters)`);

        // Create document from extracted text
        const doc = {
            pageContent: text,
            metadata: metadata || {}
        };

        // Split document into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments([doc]);
        console.log(`Split into ${splitDocs.length} chunks`);

        // Sanitize metadata
        const sanitizeMetadata = (meta: Record<string, any>): Record<string, string | number | boolean> => {
            const sanitized: Record<string, string | number | boolean> = {};
            for (const [key, value] of Object.entries(meta)) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                } else if (value !== null && value !== undefined) {
                    sanitized[key] = String(value);
                }
            }
            return sanitized;
        };

        // Apply sanitized metadata
        splitDocs.forEach(doc => {
            doc.metadata = sanitizeMetadata(doc.metadata);
        });

        // Initialize embeddings
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
            apiKey: process.env.GOOGLE_API_KEY,
            taskType: TaskType.RETRIEVAL_DOCUMENT,
        });

        // Store in ChromaDB
        const vectorStore = new Chroma(embeddings, {
            collectionName: process.env.CHROMADB_COLLECTION_NAME || 'contextual_kb_documents',
            url: process.env.CHROMADB_URL || 'http://chromadb:8000',
        });

        await vectorStore.addDocuments(splitDocs);
        console.log(`Successfully ingested image into ChromaDB collection: ${process.env.CHROMADB_COLLECTION_NAME}`);
    } catch (error) {
        console.error('Error ingesting image:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw new Error(`Failed to ingest image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

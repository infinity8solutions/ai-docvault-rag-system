import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { prisma } from '../utils';
import { ERRORS, handleServerError } from '../helpers/errors.helper';
import { STANDARD } from '../constants/request';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { randomBytes } from 'crypto';
import { IngestPdf, IngestImage } from '../helpers/rag.helper';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Helper function to get file type from extension
const getFileType = (filename: string): string => {
  const ext = getFileExtension(filename);
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.md'];

  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  return 'other';
};

// Upload document
export const uploadDocument = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { projectId } = request.params as { projectId: string };
    const userId = (request as any).user.id;

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        user_id: userId,
      },
    });

    if (!project) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'Project not found',
      });
    }

    // Get uploaded file
    const data = await request.file();

    if (!data) {
      return reply.code(ERRORS.badRequest.statusCode).send({
        message: 'No file uploaded',
      });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      return reply.code(ERRORS.badRequest.statusCode).send({
        message: 'File type not allowed',
      });
    }

    // Validate file size (get from buffer)
    const buffer = await data.toBuffer();
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.code(ERRORS.badRequest.statusCode).send({
        message: 'File size exceeds 50MB limit',
      });
    }

    // Create directory structure
    const uploadDir = path.join(process.cwd(), 'uploads', `${userId}`, `${projectId}`);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExt = getFileExtension(data.filename);
    const uniqueId = randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `${userId}_${projectId}_${timestamp}_${uniqueId}${fileExt}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, buffer);

    // Create database record
    const document = await prisma.document.create({
      data: {
        project_id: parseInt(projectId),
        user_id: userId,
        filename: filename,
        original_filename: data.filename,
        file_type: getFileType(data.filename),
        file_size: BigInt(buffer.length),
        mime_type: data.mimetype,
        storage_path: filePath,
      },
    });

    // Convert BigInt to string for JSON
    const responseDoc = {
      ...document,
      file_size: document.file_size.toString(),
    };

    return reply.code(STANDARD.CREATED.statusCode).send(responseDoc);
  } catch (error) {
    console.error('Upload error:', error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: 'Failed to upload document',
    });
  }
};

// Get all documents for a project
export const getDocumentsByProject = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { projectId } = request.params as { projectId: string };
    const userId = (request as any).user.id;

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        user_id: userId,
      },
    });

    if (!project) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'Project not found',
      });
    }

    const documents = await prisma.document.findMany({
      where: {
        project_id: parseInt(projectId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Convert BigInt to string for JSON
    const responseDocs = documents.map(doc => ({
      ...doc,
      file_size: doc.file_size.toString(),
    }));

    return reply.code(STANDARD.OK.statusCode).send(responseDocs);
  } catch (error) {
    console.error('Get documents error:', error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: 'Failed to fetch documents',
    });
  }
};

// Get document by ID
export const getDocumentById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = (request as any).user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
    });

    if (!document) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'Document not found',
      });
    }

    // Convert BigInt to string for JSON
    const responseDoc = {
      ...document,
      file_size: document.file_size.toString(),
    };

    return reply.code(STANDARD.OK.statusCode).send(responseDoc);
  } catch (error) {
    console.error('Get document error:', error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: 'Failed to fetch document',
    });
  }
};

// Download document
export const downloadDocument = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = (request as any).user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
    });

    if (!document) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'Document not found',
      });
    }

    // Check if file exists
    try {
      await fs.access(document.storage_path);
    } catch {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'File not found on server',
      });
    }

    // Stream file to response
    reply.header('Content-Type', document.mime_type);
    reply.header('Content-Disposition', `attachment; filename="${document.original_filename}"`);

    const fileStream = await fs.readFile(document.storage_path);
    return reply.send(fileStream);
  } catch (error) {
    console.error('Download error:', error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: 'Failed to download document',
    });
  }
};

// Delete document
export const deleteDocument = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = (request as any).user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
    });

    if (!document) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: 'Document not found',
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.storage_path);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete database record
    await prisma.document.delete({
      where: {
        id: parseInt(id),
      },
    });

    return reply.code(STANDARD.OK.statusCode).send({
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: 'Failed to delete document',
    });
  }
};


// Ingest document into ChromaDB vector store
export const ingestDocument = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const userId = (request as any).user.id;

    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
    });

    if (!document) {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: "Document not found",
      });
    }

    // Check if file type is supported for ingestion
    const supportedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!supportedTypes.includes(document.mime_type)) {
      return reply.code(ERRORS.badRequest.statusCode).send({
        message: "Only PDF and image files (PNG, JPEG, JPG) can be ingested.",
      });
    }

    // Check if file exists
    try {
      await fs.access(document.storage_path);
    } catch {
      return reply.code(ERRORS.notFound.statusCode).send({
        message: "File not found on server",
      });
    }

    // Prepare metadata for ChromaDB
    // Note: ChromaDB requires all metadata values to be strings, numbers, or booleans
    const metadata = {
      document_id: String(document.id),
      user_id: String(document.user_id),
      project_id: String(document.project_id),
      filename: document.original_filename,
    };

    // Ingest based on file type
    if (document.mime_type === 'application/pdf') {
      await IngestPdf(document.storage_path, metadata);
    } else if (['image/png', 'image/jpeg', 'image/jpg'].includes(document.mime_type)) {
      await IngestImage(document.storage_path, metadata);
    }

    // Update ingestion status to 'ingested'
    await prisma.document.update({
      where: { id: parseInt(id) },
      data: { ingestion_status: 'ingested' },
    });

    return reply.code(STANDARD.OK.statusCode).send({
      message: "Document successfully ingested into vector store",
      document_id: document.id,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return reply.code(ERRORS.serverError.statusCode).send({
      message: "Failed to ingest document",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

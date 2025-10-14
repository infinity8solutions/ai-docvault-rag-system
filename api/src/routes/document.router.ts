import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as documentController from '../controllers/document.controller';
import { utils } from '../utils';
import { ERRORS } from '../helpers/errors.helper';
import {
  deleteDocumentSchema,
  getDocumentByIdSchema,
  getDocumentsByProjectSchema,
} from '../schemas/Document';

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = utils.getTokenFromHeader(request.headers.authorization);

    if (!token) {
      return reply.code(ERRORS.invalidToken.statusCode).send({
        message: 'Authentication required',
      });
    }

    const decoded = utils.verifyToken(token);
    (request as any).user = decoded;
  } catch (error) {
    return reply.code(ERRORS.invalidToken.statusCode).send({
      message: 'Invalid or expired token',
    });
  }
}

export default async function documentRouter(server: FastifyInstance) {
  // Upload document
  server.post(
    '/upload/:projectId',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(getDocumentsByProjectSchema),
    },
    documentController.uploadDocument
  );

  // Get all documents for a project
  server.get(
    '/project/:projectId',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(getDocumentsByProjectSchema),
    },
    documentController.getDocumentsByProject
  );

  // Get document by ID
  server.get(
    '/:id',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(getDocumentByIdSchema),
    },
    documentController.getDocumentById
  );

  // Download document
  server.get(
    '/:id/download',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(getDocumentByIdSchema),
    },
    documentController.downloadDocument
  );

  // Delete document
  server.delete(
    '/:id',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(deleteDocumentSchema),
    },
    documentController.deleteDocument
  );

  // Ingest document into ChromaDB
  server.post(
    '/:id/ingest',
    {
      preHandler: authenticate,
      preValidation: utils.preValidation(getDocumentByIdSchema),
    },
    documentController.ingestDocument
  );
}

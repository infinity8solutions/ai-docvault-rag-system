import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as controllers from '../controllers';
import { utils } from '../utils';
import { createProjectSchema, updateProjectSchema } from '../schemas/Project';
import { ERRORS } from '../helpers/errors.helper';

// Authentication middleware
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    const token = utils.getTokenFromHeader(authHeader);

    if (!token) {
      return reply.code(ERRORS.invalidToken.statusCode).send({
        message: 'Authentication required',
      });
    }

    const decoded = utils.verifyToken(token);
    if (!decoded) {
      return reply.code(ERRORS.invalidToken.statusCode).send({
        message: 'Invalid or expired token',
      });
    }

    // Attach user to request
    (request as any).user = decoded;
  } catch (err) {
    return reply.code(ERRORS.invalidToken.statusCode).send({
      message: 'Authentication failed',
    });
  }
}

async function projectRouter(fastify: FastifyInstance) {
  // Get all projects
  fastify.get(
    '/',
    {
      preHandler: authenticate,
      config: {
        description: 'Get all projects for authenticated user',
      },
    },
    controllers.getAllProjects,
  );

  // Get single project
  fastify.get(
    '/:id',
    {
      preHandler: authenticate,
      config: {
        description: 'Get project by ID',
      },
    },
    controllers.getProjectById,
  );

  // Create project
  fastify.post(
    '/',
    {
      preHandler: authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
          },
        },
      },
      config: {
        description: 'Create new project',
      },
      preValidation: utils.preValidation(createProjectSchema),
    },
    controllers.createProject,
  );

  // Update project
  fastify.put(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
          },
        },
      },
      config: {
        description: 'Update project',
      },
      preValidation: utils.preValidation(updateProjectSchema),
    },
    controllers.updateProject,
  );

  // Delete project
  fastify.delete(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
      config: {
        description: 'Delete project',
      },
    },
    controllers.deleteProject,
  );
}

export default projectRouter;

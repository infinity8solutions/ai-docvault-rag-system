import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../utils';
import { ERRORS, handleServerError } from '../helpers/errors.helper';
import { STANDARD } from '../constants/request';
import { IProjectCreateDto, IProjectUpdateDto } from '../schemas/Project';

// Get all projects for the authenticated user
export const getAllProjects = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const userId = (request as any).user.id;

    const projects = await prisma.project.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return reply.code(STANDARD.OK.statusCode).send(projects);
  } catch (err) {
    return handleServerError(reply, err);
  }
};

// Get single project by ID
export const getProjectById = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  try {
    const userId = (request as any).user.id;
    const projectId = parseInt(request.params.id);

    if (isNaN(projectId)) {
      return reply.code(400).send({ message: 'Invalid project ID' });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (!project) {
      return reply.code(404).send({ message: 'Project not found' });
    }

    return reply.code(STANDARD.OK.statusCode).send(project);
  } catch (err) {
    return handleServerError(reply, err);
  }
};

// Create new project
export const createProject = async (
  request: FastifyRequest<{
    Body: IProjectCreateDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    const userId = (request as any).user.id;
    const { name, description } = request.body;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        user_id: userId,
      },
    });

    return reply.code(201).send(project);
  } catch (err) {
    return handleServerError(reply, err);
  }
};

// Update project
export const updateProject = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: IProjectUpdateDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    const userId = (request as any).user.id;
    const projectId = parseInt(request.params.id);
    const { name, description } = request.body;

    if (isNaN(projectId)) {
      return reply.code(400).send({ message: 'Invalid project ID' });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (!existingProject) {
      return reply.code(404).send({ message: 'Project not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    updateData.updated_at = new Date();

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return reply.code(STANDARD.OK.statusCode).send(project);
  } catch (err) {
    return handleServerError(reply, err);
  }
};

// Delete project
export const deleteProject = async (
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  try {
    const userId = (request as any).user.id;
    const projectId = parseInt(request.params.id);

    if (isNaN(projectId)) {
      return reply.code(400).send({ message: 'Invalid project ID' });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (!existingProject) {
      return reply.code(404).send({ message: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return reply.code(STANDARD.OK.statusCode).send({ message: 'Project deleted successfully' });
  } catch (err) {
    return handleServerError(reply, err);
  }
};

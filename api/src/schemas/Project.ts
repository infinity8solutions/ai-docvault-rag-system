import Joi from 'joi';

export interface IProjectCreateDto {
  name: string;
  description?: string;
}

export interface IProjectUpdateDto {
  name?: string;
  description?: string;
}

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Project name must be at least 3 characters long',
    'string.max': 'Project name must be at most 100 characters long',
    'any.required': 'Project name is required',
  }),
  description: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'Description must be at most 500 characters long',
  }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Project name must be at least 3 characters long',
    'string.max': 'Project name must be at most 100 characters long',
  }),
  description: Joi.string().max(500).allow('', null).optional().messages({
    'string.max': 'Description must be at most 500 characters long',
  }),
}).min(1);

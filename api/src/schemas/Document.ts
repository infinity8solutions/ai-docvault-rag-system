import Joi from 'joi';

export const deleteDocumentSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const getDocumentByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const getDocumentsByProjectSchema = Joi.object({
  projectId: Joi.number().integer().positive().required(),
});

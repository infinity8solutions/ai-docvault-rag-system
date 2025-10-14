import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../utils';
import { ERRORS, handleServerError } from '../helpers/errors.helper';
import * as JWT from 'jsonwebtoken';
import { utils } from '../utils';
import { STANDARD } from '../constants/request';
import { IUserLoginDto, IUserSignupDto } from '../schemas/User';

export const login = async (
  request: FastifyRequest<{
    Body: IUserLoginDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    const { email, password } = request.body;
    console.log('Login attempt for:', email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return reply
        .code(ERRORS.userNotExists.statusCode)
        .send(ERRORS.userNotExists.message);
    }

    console.log('User found, comparing password');
    console.log('Plain password:', password);
    console.log('Hashed password:', user.password);
    const checkPass = await utils.compareHash(password, user.password);
    console.log('Password comparison result:', checkPass);
    if (!checkPass) {
      console.log('Password mismatch');
      return reply
        .code(ERRORS.userCredError.statusCode)
        .send(ERRORS.userCredError.message);
    }

    const token = JWT.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.APP_JWT_SECRET as string,
    );

    return reply.code(STANDARD.OK.statusCode).send({
      token,
      user,
    });
  } catch (err) {
    return handleServerError(reply, err);
  }
};

export const signUp = async (
  request: FastifyRequest<{
    Body: IUserSignupDto;
  }>,
  reply: FastifyReply,
) => {
  try {
    const { email, password, firstName, lastName } = request.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return reply.code(ERRORS.userExists.statusCode).send(ERRORS.userExists);
    }

    const hashPass = await utils.genSalt(10, password);
    const createUser = await prisma.user.create({
      data: {
        email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: String(hashPass),
      },
    });

    const token = JWT.sign(
      {
        id: createUser.id,
        email: createUser.email,
      },
      process.env.APP_JWT_SECRET as string,
    );

    delete createUser.password;

    return reply.code(STANDARD.OK.statusCode).send({
      token,
      user: createUser,
    });
  } catch (err) {
    return handleServerError(reply, err);
  }
};

/**
 * @author AjayKrishna
 * @summary helper functions used in API Logic
 */

import bcrypt from 'bcryptjs';
import { FastifyRequest } from 'fastify';

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const checkPassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const getAuthenticationToken = (req: FastifyRequest) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  return token;
};

export const getIdFromToken = (req: FastifyRequest) => {
  const user = decodeToken(req);
  return user.sub;
};

export const decodeToken = (req: FastifyRequest) => {
  const userJson = JSON.stringify(req.user);
  const user = JSON.parse(userJson);
  return user;
};

export const getRoleFromToken = (req: FastifyRequest) => {
  const user = decodeToken(req);
  return user.role;
};

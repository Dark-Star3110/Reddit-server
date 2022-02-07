import { Context } from "../types/Context";
import { MiddlewareFn } from "type-graphql";
import { AuthenticationError } from "apollo-server-express";

export const checkAuth: MiddlewareFn<Context> = async (
  { context: { req } },
  next
) => {
  if (!req.session.userId) {
    throw new AuthenticationError("ban can dang nhap de lam dieu nay");
  }
  return next();
};

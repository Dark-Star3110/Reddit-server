import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import argon2 from "argon2";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { LoginInput } from "../types/LoginInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constants";
import { ForgotPasswordInput } from "../types/ForgotPasswordInput";
import { sendEmail } from "../utils/sendEmail";
import { TokenModel } from "../models/Token";
import { v4 as uuidv4 } from "uuid";
import { ChangePasswordInput } from "../types/ChangePasswordInput";

@Resolver((_of) => User)
export class UserResolver {
  @FieldResolver((_return) => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    return req.session.userId === user.id ? user.email : "";
  }

  @Query((_return) => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | null | undefined> {
    if (!req.session.userId) return null;
    const user = await User.findOne(req.session.userId);
    return user;
  }

  @Mutation((_return) => UserMutationResponse)
  async register(
    @Arg("registerInput") registerInput: RegisterInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    const validateRegisterInputError = validateRegisterInput(registerInput);
    if (validateRegisterInputError !== null)
      return {
        code: 400,
        success: false,
        ...validateRegisterInputError,
      };

    try {
      const { username, email, password } = registerInput;
      const existingUser = await User.findOne({
        where: [{ username: username }, { email: email }],
      }); // Select * From user Where username = username Or email = email
      if (existingUser) {
        console.log("user da ton tai");
        return {
          code: 400,
          success: false,
          message: "User has already been",
          errors: [
            {
              field: existingUser.username === username ? "username" : "email",
              message: `${
                existingUser.username === username ? "username" : "email"
              } already exists`,
            },
          ],
        };
      }

      const hashedPassword = await argon2.hash(password);

      const newUser = await User.create({
        username,
        password: hashedPassword,
        email,
      });

      await User.save(newUser);
      // session
      req.session.userId = newUser.id;

      return {
        code: 200,
        success: true,
        message: "user register successfull",
        user: newUser,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        success: false,
        message: `server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => UserMutationResponse)
  async login(
    @Arg("loginInput") { usernameOrEmail, password }: LoginInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      const existingUser = await User.findOne(
        usernameOrEmail.includes("@")
          ? { email: usernameOrEmail }
          : { username: usernameOrEmail }
      );

      if (!existingUser) {
        return {
          code: 400,
          success: false,
          message: "user not found",
          errors: [
            {
              field: "usernameOrEmail",
              message: "Username or email incorrect",
            },
          ],
        };
      }
      const passwordValid = await argon2.verify(
        existingUser.password,
        password
      );
      if (!passwordValid) {
        return {
          code: 400,
          success: false,
          message: "Password is incorrect",
          errors: [
            {
              field: "password",
              message: "Password is incorrect",
            },
          ],
        };
      }

      // session
      req.session.userId = existingUser.id;

      return {
        code: 200,
        success: true,
        message: "login successfull",
        user: existingUser,
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        success: false,
        message: `server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => Boolean)
  async logout(@Ctx() { req, res }: Context): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((err) => {
        if (err) {
          console.log("Destroy session failed");
          resolve(false);
        }
        resolve(true);
      });
    });
  }

  @Mutation((_return) => Boolean)
  async forgotPassword(
    @Arg("forgotPasswordInput") forgotPasswordInput: ForgotPasswordInput
  ): Promise<boolean> {
    const user = await User.findOne({ email: forgotPasswordInput.email });
    if (!user) return true;
    const resetToken = uuidv4();
    const hashResetToken = await argon2.hash(resetToken);

    // save token to db
    await new TokenModel({
      userId: `${user.id}`,
      token: hashResetToken,
    }).save();

    await sendEmail(
      forgotPasswordInput.email,
      `<a href="http://localhost:3000/change-password/?token=${resetToken}&userId=${user.id}">enter to change password</a>`
    );
    return true;
  }

  @Mutation((_return) => UserMutationResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("userId") userId: string,
    @Arg("changePasswordInput") changePasswordInput: ChangePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    if (changePasswordInput.newPassword.length <= 2) {
      return {
        code: 400,
        success: false,
        message: "Invalid password",
        errors: [
          {
            field: "newPassword",
            message: "Length newPassword must be greater than 2",
          },
        ],
      };
    }
    try {
      const resetPasswordTokenRecord = await TokenModel.findOne({
        userId: userId,
      });
      if (!resetPasswordTokenRecord)
        return {
          code: 400,
          success: false,
          message: "Token Exists or Expired",
          errors: [
            {
              field: "token",
              message: "Token Exists or Expired",
            },
          ],
        };
      const resetPasswordTokenValid = argon2.verify(
        resetPasswordTokenRecord.token,
        token
      );
      if (!resetPasswordTokenValid) {
        return {
          code: 400,
          success: false,
          message: "Token Exists or Expired",
          errors: [
            {
              field: "token",
              message: "Token Exists or Expired",
            },
          ],
        };
      }
      const userIdNum = parseInt(userId);
      const user = await User.findOne(userIdNum);
      if (!user) {
        return {
          code: 400,
          success: false,
          message: "User no loger",
          errors: [
            {
              field: "token",
              message: "User no loger exists",
            },
          ],
        };
      }

      const updatePassword = await argon2.hash(changePasswordInput.newPassword);
      await User.update({ id: userIdNum }, { password: updatePassword });
      await resetPasswordTokenRecord.deleteOne();
      req.session.userId = user.id;
      return {
        code: 200,
        success: true,
        message: "change password successfully",
        user,
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Server error ${error.message}`,
      };
    }
  }
}

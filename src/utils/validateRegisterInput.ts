import { RegisterInput } from "../types/RegisterInput";

export const validateRegisterInput = (registerInput: RegisterInput) => {
  if (!registerInput.email.includes("@")) {
    return {
      message: "invalid email",
      errors: [
        {
          field: "email",
          message: "email must includes @ symbol",
        },
      ],
    };
  }
  if (registerInput.username.length < 2) {
    return {
      message: "invalid username",
      errors: [
        {
          field: "username",
          message: "Length username must be greater than 2 characters",
        },
      ],
    };
  }

  if (registerInput.username.includes("@")) {
    return {
      message: "invalid username",
      errors: [
        {
          field: "username",
          message: "username can not includes @",
        },
      ],
    };
  }

  if (registerInput.password.length <= 2) {
    return {
      message: "invalid password",
      errors: [
        {
          field: "password",
          message: "Length password must be greater than 2 characters",
        },
      ],
    };
  }
  return null;
};

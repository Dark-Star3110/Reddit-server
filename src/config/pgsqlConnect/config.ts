import { __prod__ } from "../../constants";
import { ConnectionOptions } from "typeorm";
import entities from "../../entities";
import path from "path";

const config: ConnectionOptions = {
  type: "postgres",
  ...(__prod__
    ? { url: process.env.DATABASE_URL }
    : {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: "reddit",
      }),
  ...(__prod__ ? {} : { synchronize: true }),
  ...(__prod__
    ? {
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        ssl: true,
      }
    : {}),
  logging: true,
  entities,
  migrations: [path.join(__dirname, "../../migrations/*")],
};
export default config;

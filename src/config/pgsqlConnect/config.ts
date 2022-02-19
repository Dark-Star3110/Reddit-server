import { ConnectionOptions } from "typeorm";
import entities from "../../entities";

const config: ConnectionOptions = {
  type: "postgres",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: "reddit",
  synchronize: true,
  logging: true,
  entities,
};
export default config;

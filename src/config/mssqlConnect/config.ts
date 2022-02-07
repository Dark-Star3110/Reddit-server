import { ConnectionOptions } from "typeorm";
import entities from "../../entities";

const config: ConnectionOptions = {
  type: "mssql",
  host: "localhost",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: "reddit",
  synchronize: true,
  logging: true,
  entities,
  options: {
    encrypt: false,
  },
};
export default config;

require("dotenv").config();
import "reflect-metadata";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import connectMG from "./config/mongoConnect/connect";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, __prod__ } from "./constants";
import { PostResolver } from "./resolvers/post";
import cors from "cors";
import { Context } from "./types/Context";
import { buildDataLoaders } from "./utils/dataLoaders";
import connectPGSQL from "./config/pgsqlConnect/connect";

const port = process.env.PORT || 3000;

const listen = async () => {
  const connection = await connectPGSQL();
  await connectMG();
  // test send email
  const app = express();
  // const httpServer = http.createServer(app);

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: MongoStore.create({
        mongoUrl: `mongodb+srv://${process.env.SESSION_DB_USERNAME}:${process.env.SESSION_DB_PASSWORD}@reddit.v9zq2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
        httpOnly: true, // frontend cant access cookie
        secure: __prod__, // cookie only work on https
        sameSite: "lax",
      },
      secret: process.env.SESSION_SECRET as string,
      saveUninitialized: false, // ko save session emty
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver, PostResolver],
      validate: false,
    }),
    context: ({ req, res }): Context => ({
      req,
      res,
      connection,
      dataLoader: buildDataLoaders(),
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });
  return new Promise((resolve, reject) => {
    app.listen(port).once("listening", resolve).once("error", reject);
  });
};
async function main() {
  try {
    await listen();
    console.log(`server running on port http://localhost:${port}`);
    console.log(
      `apollo server running on port http://localhost:${port}/graphql`
    );
  } catch (err) {
    console.log(err);
  }
}

main();

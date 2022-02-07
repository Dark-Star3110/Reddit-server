import mongoose from "mongoose";

export default async function connectMG() {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.SESSION_DB_USERNAME}:${process.env.SESSION_DB_PASSWORD}@reddit.v9zq2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    );
    console.log("Connect mongoDB success");
  } catch (error) {
    console.log("Connect mongoDB error", error.message);
  }
}

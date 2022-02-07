import { UpdatePostInput } from "../types/UpdatePostInput";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
  registerEnumType,
} from "type-graphql";
// import { Context } from "../types/Context";
// import { COOKIE_NAME } from "../constants";
import { Post } from "../entities/Post";
import { CreatePostInput } from "../types/CreatePostInput";
import { PostMutationResponse } from "../types/PostMutationResponse";
import { checkAuth } from "../middleware/checkAuth";
import { User } from "../entities/User";
import { PaginatedPosts } from "../types/PaginatedPosts";
import { LessThan } from "typeorm";
import { Context } from "../types/Context";
import { VoteType } from "../types/VoteType";
import { UserInputError } from "apollo-server-core";
import { VotePost } from "../entities/VotePost";

registerEnumType(VoteType, {
  name: "VoteType",
});

@Resolver((_of) => Post)
export class PostResolver {
  @FieldResolver((_return) => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver((_return) => User)
  async user(@Root() root: Post) {
    return await User.findOne({ id: root.userId });
  }

  @FieldResolver((_return) => Int)
  async voteValue(@Root() root: Post, @Ctx() { req }: Context) {
    if (!req.session.userId) return 0;
    const existingVote = await VotePost.findOne({
      postId: root.id,
      userId: req.session.userId,
    });

    return existingVote ? existingVote.value : 0;
  }

  @Mutation((_return) => PostMutationResponse)
  async createPost(
    @Arg("createPostInput") { title, text }: CreatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const userId = req.session.userId;
      const newPost = Post.create({ title, text, userId });
      await newPost.save();
      return {
        code: 200,
        success: true,
        message: "create post successfully",
        post: newPost,
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

  @Query((_return) => PaginatedPosts, { nullable: true })
  async posts(
    @Arg("limit", (_type) => Int) limit: number,
    @Arg("cursor", { nullable: true }) cursor?: string
  ): Promise<PaginatedPosts | null> {
    try {
      const totalCount = await Post.count();
      const realLimit = Math.min(10, limit);
      const findOptions: { [key: string]: any } = {
        order: {
          createAt: "DESC",
        },
        take: realLimit,
      };
      let lastPost: Post[] = [];
      if (cursor) {
        findOptions.where = { createAt: LessThan(cursor) };
        lastPost = await Post.find({
          order: {
            createAt: "ASC",
          },
          take: 1,
        });
      }
      // console.log(lastPost[0]);

      const posts = await Post.find(findOptions);
      if (posts.length <= 0) {
        // console.log("< 0");

        return null;
      }
      // console.log(posts);

      return {
        totalCount,
        cursor: posts[posts.length - 1].createAt,
        hasMore: cursor
          ? posts[posts.length - 1].createAt.toString() !==
            lastPost[0].createAt.toString()
          : posts.length !== totalCount,
        paginatedPosts: posts,
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query((_return) => Post, { nullable: true })
  async post(@Arg("id", (_type) => ID) id: number): Promise<Post | undefined> {
    try {
    } catch (err) {
      console.log(err);
      return undefined;
    }
    const post = await Post.findOne(id);
    return post;
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async updatePost(
    @Arg("updatePostInput") { id, title, text }: UpdatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    const existingPost = await Post.findOne(id);
    if (!existingPost) {
      return {
        code: 404,
        success: false,
        message: "post not found",
      };
    }
    if (existingPost.userId !== req.session.userId) {
      return {
        code: 400,
        success: false,
        message: "UnAuthorised",
      };
    }
    existingPost.title = title;
    existingPost.text = text;
    await Post.save(existingPost);
    return {
      code: 200,
      success: true,
      message: "post updated successfully",
      post: existingPost,
    };
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async deletePost(
    @Arg("id", (_type) => ID) id: number,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const existingPost = await Post.findOne(id);
      if (!existingPost) {
        return {
          code: 404,
          success: false,
          message: "post not found",
        };
      }
      if (existingPost.userId !== req.session.userId) {
        return {
          code: 400,
          success: false,
          message: "UnAuthorised",
        };
      }
      await Post.delete(id);
      return {
        code: 200,
        success: true,
        message: "post deleted successfully",
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

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async vote(
    @Arg("postId", (_type) => Int) postId: number,
    @Arg("inputVoteValue", (_type) => VoteType) inputVoteValue: VoteType,
    @Ctx()
    {
      req: {
        session: { userId },
      },
      connection,
    }: Context
  ): Promise<PostMutationResponse> {
    return await connection.transaction(async (transactionEntityManager) => {
      let post = await transactionEntityManager.findOne(Post, postId);
      // post not found
      if (!post) {
        throw new UserInputError("post not found");
      }

      // post existing vote
      const existingVote = await transactionEntityManager.findOne(VotePost, {
        postId,
        userId,
      });
      if (existingVote && existingVote.value !== inputVoteValue) {
        await transactionEntityManager.save(VotePost, {
          ...existingVote,
          value: inputVoteValue,
        });

        post = await transactionEntityManager.save(Post, {
          ...post,
          points: post.points + 2 * inputVoteValue,
        });
      }

      if (!existingVote) {
        const newVote = transactionEntityManager.create(VotePost, {
          userId,
          postId,
          value: inputVoteValue,
        });
        await transactionEntityManager.save(newVote);
        post.points = post.points + inputVoteValue;
        post = await transactionEntityManager.save(post);
      }

      return {
        code: 200,
        success: true,
        message: "Post voted",
        post,
      };
    });
  }
}

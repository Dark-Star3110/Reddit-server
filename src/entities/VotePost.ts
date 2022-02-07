import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@Entity()
export class VotePost extends BaseEntity {
  @PrimaryColumn()
  userId!: number;
  @ManyToOne((_to) => User, (user) => user.votePosts)
  user!: User;

  @PrimaryColumn()
  postId!: number;
  @ManyToOne((_to) => Post, (post) => post.votePosts)
  post!: Post;

  @Column()
  value!: number;
}

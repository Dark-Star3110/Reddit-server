import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Post } from "./Post";
import { VotePost } from "./VotePost";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @Field()
  @Column({ unique: true })
  email!: string;

  @OneToMany((_to) => VotePost, (votepost) => votepost.user)
  votePosts: VotePost[];

  @Field()
  @CreateDateColumn()
  createAt: Date;

  @Field()
  @UpdateDateColumn()
  updateAt: Date;
}

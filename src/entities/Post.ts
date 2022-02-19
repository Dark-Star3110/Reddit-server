import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { VotePost } from "./VotePost";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field((__type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  userId!: number;

  @Field((_type) => User)
  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column({ type: "text" })
  text!: string;

  @OneToMany((_to) => VotePost, (votepost) => votepost.post)
  votePosts: VotePost[];

  @Field()
  @Column({ default: 0 })
  points!: number;

  @Field()
  voteValue!: number;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updateAt: Date;
}

import DataLoader from "dataloader";
import { VotePost } from "../entities/VotePost";
import { User } from "../entities/User";

interface VoteTypeCondition {
  postId: number;
  userId: number;
}

const batchGetUsers = async (userIds: number[]) => {
  const users = await User.findByIds(userIds);
  return userIds.map((userId) => users.find((user) => user.id === userId));
};

const batchGetVoteTypes = async (voteTypeConditions: VoteTypeCondition[]) => {
  const voteTypes = await VotePost.findByIds(voteTypeConditions);
  return voteTypeConditions.map((voteTypeCondition) =>
    voteTypes.find(
      (voteType) =>
        voteTypeCondition.postId === voteType.postId &&
        voteTypeCondition.userId === voteType.userId
    )
  );
};

export const buildDataLoaders = () => ({
  userLoaders: new DataLoader<number, User | undefined>((userIds) =>
    batchGetUsers(userIds as number[])
  ),

  voteTypeLoaders: new DataLoader<VoteTypeCondition, VotePost | undefined>(
    (voteTypeConditions) =>
      batchGetVoteTypes(voteTypeConditions as VoteTypeCondition[])
  ),
});

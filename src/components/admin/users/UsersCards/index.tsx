import type { UsersCardsProps } from "@/interface";
import { UsersCardsContent } from "./UsersCardsContent";

export const UsersCards = (props: UsersCardsProps) => {
  return <UsersCardsContent {...props} />;
};

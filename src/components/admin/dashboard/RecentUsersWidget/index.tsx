import type { RecentUsersWidgetProps } from "@/interface";
import { RecentUsersWidgetContent } from "./RecentUsersWidgetContent";

export const RecentUsersWidget = (props: RecentUsersWidgetProps) => {
  return <RecentUsersWidgetContent {...props} />;
};

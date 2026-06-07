import { Empty } from "@/components/ui/empty";
import { BookOpenIcon } from "lucide-react";

export default function StoriesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Stories</h1>
      <Empty
        title="Stories"
        description="This module is under construction."
        icon={<BookOpenIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

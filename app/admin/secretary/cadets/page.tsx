import { Empty } from "@/components/ui/empty";
import { UserPlusIcon } from "lucide-react";

export default function CadetsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Cadets</h1>
      <Empty
        title="Cadets"
        description="This module is under construction."
        icon={<UserPlusIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

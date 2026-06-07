import { Empty } from "@/components/ui/empty";
import { UsersIcon } from "lucide-react";

export default function IntakesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Intakes</h1>
      <Empty
        title="Intakes"
        description="This module is under construction."
        icon={<UsersIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

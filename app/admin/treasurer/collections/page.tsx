import { Empty } from "@/components/ui/empty";
import { WalletIcon } from "lucide-react";

export default function CollectionsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Collections</h1>
      <Empty
        title="Collections"
        description="This module is under construction."
        icon={<WalletIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

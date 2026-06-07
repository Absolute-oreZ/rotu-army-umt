import { Empty } from "@/components/ui/empty";
import { ImageIcon } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Portfolio</h1>
      <Empty
        title="Portfolio"
        description="This module is under construction."
        icon={<ImageIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

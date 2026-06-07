import { Empty } from "@/components/ui/empty";
import { HandshakeIcon } from "lucide-react";

export default function CollaborationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Collaborations</h1>
      <Empty
        title="Collaborations"
        description="This module is under construction."
        icon={<HandshakeIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

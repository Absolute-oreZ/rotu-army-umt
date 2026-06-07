import { Empty } from "@/components/ui/empty";
import { MailIcon } from "lucide-react";

export default function NewslettersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Newsletters</h1>
      <Empty
        title="Newsletters"
        description="This module is under construction."
        icon={<MailIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

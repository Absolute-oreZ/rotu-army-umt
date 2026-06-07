import { Empty } from "@/components/ui/empty";
import { ReceiptIcon } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Expenses</h1>
      <Empty
        title="Expenses"
        description="This module is under construction."
        icon={<ReceiptIcon className="size-5 text-muted-foreground" />}
      />
    </div>
  );
}

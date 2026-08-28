import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { FlowCanvas } from "@/components/flow/FlowCanvas";

export default async function FlowPage() {
  await requireStaff();

  const nodes = await prisma.flowNode.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      detail: true,
      color: true,
      order: true,
      parentId: true,
    },
  });

  return <FlowCanvas initialNodes={nodes} />;
}

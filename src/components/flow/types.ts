export interface FlowNodeItem {
  id: string;
  title: string;
  detail: string | null;
  color: string | null;
  order: number;
  parentId: string | null;
}

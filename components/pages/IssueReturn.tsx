import type { Role, StockRow } from "../AppShell";
import type { DamageRow } from "../features/reports/types";
import IssueReturnPage from "../features/issue-return/IssueReturnPage";

type UpdatedStockRow = {
  id: string;
  qty: number;
  available: number;
  status: string;
  repairing: number;
};

type Props = {
  role: Role;
  stockData: StockRow[];
  onStockRowsUpdated: (rows: UpdatedStockRow[]) => void;
  onMarkEventAsIssued?: (eventId: string) => void;
  onUnmarkEventAsIssued?: (eventId: string) => void;
  onAddDamageRows?: (rows: DamageRow[]) => void;
};

export default function IssueReturn(props: Props) {
  return <IssueReturnPage {...props} />;
}
import type { Role, StockRow } from "../AppShell";
import type { DamageRow } from "../features/reports/types";
import ReportsPage from "../features/reports/ReportsPage";

type Props = {
  role: Role;
  stockData: StockRow[];
  extraDamageRows?: DamageRow[];
};

export default function Reports(props: Props) {
  return <ReportsPage {...props} />;
}
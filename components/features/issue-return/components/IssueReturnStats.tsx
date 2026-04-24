import React from "react";
import { ArrowRight, Clock3, CornerDownLeft, Package } from "lucide-react";
import type { IssueReturnStats as IssueReturnStatsType } from "../types";
import IssueReturnStatCard from "./IssueReturnStatCard";

type Props = {
  stats: IssueReturnStatsType;
};

export default function IssueReturnStats({ stats }: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <IssueReturnStatCard
        icon={<Clock3 className="h-5 w-5" />}
        value={stats.pending}
        label="รออนุมัติ"
        tone="amber"
      />

      <IssueReturnStatCard
        icon={<ArrowRight className="h-5 w-5" />}
        value={stats.readyToIssue}
        label="พร้อมเบิก"
        tone="emerald"
      />

      <IssueReturnStatCard
        icon={<Package className="h-5 w-5" />}
        value={stats.inUse}
        label="กำลังใช้งาน"
        tone="violet"
      />

      <IssueReturnStatCard
        icon={<CornerDownLeft className="h-5 w-5" />}
        value={stats.readyToReturn}
        label="พร้อมคืน"
        tone="sky"
      />
    </div>
  );
}
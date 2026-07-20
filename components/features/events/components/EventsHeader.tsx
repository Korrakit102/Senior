import type { Role } from "../types";

type EventsHeaderProps = {
  role: Role;
  onCreate: () => void;
};

export default function EventsHeader({
  role,
  onCreate,
}: EventsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          จัดการอีเวนต์
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          สร้างและจัดการงานอีเวนต์ พร้อมตรวจสอบสต็อก
        </p>
      </div>

      {role === "SA" && (
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-red-600/10 hover:bg-red-700 active:translate-y-[1px]"
        >
          <span className="text-lg leading-none">+</span>
          สร้างอีเวนต์ใหม่
        </button>
      )}
    </div>
  );
}

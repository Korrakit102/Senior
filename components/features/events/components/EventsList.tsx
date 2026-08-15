import EventListCard from "./EventListCard";
import type { EventItem, Role } from "../types";

type EventsListProps = {
  events: EventItem[];
  role: Role;
  isLoading: boolean;
  onOpenDetail: (eventId: string) => void;
  onManageItems: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onUploadReceipt: (eventId: string, file: File) => Promise<void>;
  onConfirmPayment: (eventId: string) => Promise<void>;
};

export default function EventsList({
  events,
  role,
  isLoading,
  onOpenDetail,
  onManageItems,
  onDeleteEvent,
  onUploadReceipt,
  onConfirmPayment,
}: EventsListProps) {
  return (
    <div className="mt-5 space-y-4">
      {isLoading && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
          กำลังโหลดข้อมูลอีเวนต์...
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
          ไม่พบรายการอีเวนต์
        </div>
      )}

      {events.map((event) => (
        <EventListCard
          key={event.id}
          event={event}
          role={role}
          onOpenDetail={onOpenDetail}
          onManageItems={onManageItems}
          onDelete={onDeleteEvent}
          onUploadReceipt={onUploadReceipt}
          onConfirmPayment={onConfirmPayment}
        />
      ))}
    </div>
  );
}

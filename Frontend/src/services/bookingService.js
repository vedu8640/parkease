import { useSyncExternalStore } from "react";
import { userBookings } from "../data/mockData";

const KEY = "parkease-bookings-v4";
const DRAFT_KEY = "parkease-upcoming-booking";
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const prettyTime = (value) =>
  new Date(`2026-01-01T${value}`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
const seed = () =>
  userBookings.map((booking, index) => ({
    ...booking,
    token: `PE-${booking.id.slice(-5)}-ENTRY`,
    dateISO:
      index === 0
        ? "2026-09-12"
        : `2026-08-${String(16 - index * 2).padStart(2, "0")}`,
    start24: index === 0 ? "10:00" : index === 1 ? "09:00" : "10:00",
    end24: index === 0 ? "15:00" : index === 1 ? "13:00" : "12:00",
    entryVerified: false,
    startedAt: null,
    extended: false,
  }));
let snapshot;
const read = () => {
  if (snapshot) return snapshot;
  try {
    snapshot = JSON.parse(sessionStorage.getItem(KEY)) || seed();
  } catch {
    snapshot = seed();
  }
  return snapshot;
};
const write = (bookings) => {
  snapshot = bookings;
  sessionStorage.setItem(KEY, JSON.stringify(bookings));
  notify();
  return bookings;
};
export const getBookings = () => read();
export const getBooking = (id) =>
  read().find((booking) => booking.id === id || booking.bookingId === id) ||
  null;
export const useBookings = () =>
  useSyncExternalStore(subscribe, getBookings, seed);
export const useBooking = (id) =>
  useBookings().find(
    (booking) => booking.id === id || booking.bookingId === id,
  ) || null;
const update = (id, patch) =>
  write(
    read().map((booking) =>
      booking.id === id || booking.bookingId === id
        ? { ...booking, ...patch }
        : booking,
    ),
  );
export const createBooking = (draft) => {
  const booking = {
    id: draft.bookingId,
    bookingId: draft.bookingId,
    token: `PE-${draft.bookingId.slice(-5)}-ENTRY`,
    slot: draft.slot.id,
    zone: draft.slot.zone,
    vehicle: draft.vehicleType,
    number: draft.vehicle.number,
    date: new Date(`${draft.date}T00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    dateISO: draft.date,
    start: prettyTime(draft.start),
    end: prettyTime(draft.end),
    start24: draft.start,
    end24: draft.end,
    status: "Booked",
    created: "Today",
    entryVerified: false,
    startedAt: null,
    extended: false,
  };
  write([booking, ...read().filter((item) => item.id !== booking.id)]);
  return booking;
};
export const cancelBooking = (id) =>
  update(id, { status: "Cancelled", cancelledAt: new Date().toISOString() });
export const verifyEntry = (id, valid = true) => {
  const booking = getBooking(id);
  const allowed =
    valid && booking && ["Booked", "Grace Period"].includes(booking.status);
  if (allowed)
    update(id, { entryVerified: true, verifiedAt: new Date().toISOString() });
  return { valid: Boolean(allowed), booking: getBooking(id) };
};
export const startParking = (id) =>
  update(id, {
    status: "Active",
    startedAt: new Date().toISOString(),
    entryVerified: true,
  });
export const endParking = (id) => {
  const booking = getBooking(id);
  const duration = booking?.startedAt
    ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(booking.startedAt).getTime()) / 60000,
        ),
      )
    : 0;
  return update(id, {
    status: "Completed",
    endedAt: new Date().toISOString(),
    duration,
  });
};
export const extendParking = (id, newEnd) => {
  const booking = getBooking(id);
  if (!booking || booking.status !== "Active")
    return { ok: false, reason: "Parking is not active." };
  const conflict =
    booking.slot === "C05" &&
    booking.dateISO === "2026-09-12" &&
    newEnd > "15:00";
  if (conflict)
    return {
      ok: false,
      reason: `Slot ${booking.slot} is already booked during this time.`,
    };
  update(id, { end24: newEnd, end: prettyTime(newEnd), extended: true });
  return { ok: true, booking: getBooking(id) };
};
export const handleNoShow = (id) =>
  update(id, { status: "No-show", releasedAt: new Date().toISOString() });
export const getBookingStatus = (id) => getBooking(id)?.status;
export const reportParkingIssue = (report) => {
  const reports = JSON.parse(
    sessionStorage.getItem("parkease-parking-reports") || "[]",
  );
  sessionStorage.setItem(
    "parkease-parking-reports",
    JSON.stringify([
      { ...report, id: Date.now(), createdAt: new Date().toISOString() },
      ...reports,
    ]),
  );
  return true;
};
export const saveMockBooking = (draft) => {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  return createBooking(draft);
};
export const getMockBooking = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};

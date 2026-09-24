import { bookingRecords } from "../data/mockData";

const zones = [
  "Academic Block",
  "Library",
  "Admin Block",
  "Student Zone",
  "Faculty Zone",
];
export const makeSlots = (vehicleType) => {
  const total = vehicleType === "Car" ? 30 : 60;
  const prefix = vehicleType === "Car" ? "C" : "B";
  return Array.from({ length: total }, (_, index) => {
    const number = `${prefix}${String(index + 1).padStart(2, "0")}`;
    return {
      id: number,
      number,
      type: vehicleType,
      zone: zones[index % zones.length],
      unavailable: index === 23 || (vehicleType === "Bike" && index === 44),
    };
  });
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
export const getSlotStatus = (slot, date, start, end) => {
  if (slot.unavailable) return "unavailable";
  const booked = bookingRecords.some(
    (record) =>
      record.slot === slot.id &&
      record.date === date &&
      overlaps(start, end, record.start, record.end),
  );
  return booked ? "booked" : "available";
};

export const eventPreview = {
  id: "annual-fest-2026",
  name: "Annual Fest 2026",
  dates: "12–14 April",
  guestParkingEnabled: false,
};

export const parkingZones = {
  car: ["C01", "C02", "C03"],
  bike: ["B01", "B02", "B03", "B04"],
};

export const registeredVehicles = [
  { id: "car-1", type: "Car", name: "Honda City", number: "MP09AB1234" },
  { id: "bike-1", type: "Bike", name: "Honda Activa", number: "MP09CD5678" },
];

export const bookingRecords = [
  { slot: "C05", date: "2026-09-12", start: "12:00", end: "14:00" },
  { slot: "C11", date: "2026-09-12", start: "10:00", end: "15:00" },
  { slot: "B08", date: "2026-09-12", start: "10:00", end: "13:00" },
  { slot: "B17", date: "2026-09-13", start: "09:00", end: "16:00" },
];

export const currentUser = {
  name: "Vedika Pandey",
  firstName: "Vedika",
  role: "Student",
  collegeId: "0808CI241292",
  email: "student@example.edu",
  phone: "+91 98765 43210",
  vehicle: "MP09XX0000",
};
export const userBookings = [
  {
    id: "PK-2026-00124",
    slot: "C05",
    vehicle: "Car",
    number: "MP09XX0000",
    zone: "Student Parking Zone",
    date: "18 Aug 2026",
    start: "10:00 AM",
    end: "3:00 PM",
    status: "Booked",
    created: "17 Aug 2026",
  },
  {
    id: "PK-2026-00119",
    slot: "B14",
    vehicle: "Bike",
    number: "MP09CD5678",
    zone: "Student Bike Zone",
    date: "16 Aug 2026",
    start: "9:00 AM",
    end: "1:00 PM",
    status: "Completed",
    created: "15 Aug 2026",
  },
  {
    id: "PK-2026-00112",
    slot: "C08",
    vehicle: "Car",
    number: "MP09XX0000",
    zone: "Faculty Parking Zone",
    date: "14 Aug 2026",
    start: "11:00 AM",
    end: "2:00 PM",
    status: "Cancelled",
    created: "13 Aug 2026",
  },
  {
    id: "PK-2026-00105",
    slot: "B03",
    vehicle: "Bike",
    number: "MP09CD5678",
    zone: "Student Bike Zone",
    date: "12 Aug 2026",
    start: "10:00 AM",
    end: "12:00 PM",
    status: "Expired",
    created: "11 Aug 2026",
  },
];
export const mockNotifications = [
  {
    id: 1,
    category: "Bookings",
    title: "Booking Confirmed",
    message: "Your parking booking for C05 is confirmed.",
    time: "10 min ago",
    unread: true,
  },
  {
    id: 2,
    category: "Parking",
    title: "Parking Reminder",
    message: "Your parking starts at 10:00 AM.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    category: "Parking",
    title: "Start Parking Reminder",
    message:
      "Your booking will be released if you don't start parking within the allowed time.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 4,
    category: "Bookings",
    title: "Booking Cancelled",
    message: "Your booking for B14 has been cancelled.",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 5,
    category: "System",
    title: "Report Submitted",
    message: "Your parking issue report has been submitted.",
    time: "4 days ago",
    unread: false,
  },
];

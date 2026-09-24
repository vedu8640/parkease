import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { domMax, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Car,
  CircleAlert,
  FileBarChart,
  LayoutDashboard,
  MapPin,
  Menu,
  OctagonXIcon,
  Plus,
  Search,
  ShieldAlert,
  Users,
  QrCode,
} from "lucide-react";
import {
  getBookings,
  useBookings,
  cancelBooking,
} from "../services/bookingService";
import { makeSlots } from "../services/parkingService";
import { useAuthenticatedUser, logoutMockUser } from "../services/authService";
import { request } from "../services/api";

const links = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Parking Slots", "/admin/slots", MapPin],
  ["Bookings", "/admin/bookings", CalendarDays],
  ["Users", "/admin/users", Users],
  ["Reports", "/admin/reports", FileBarChart],
  ["Violations", "/admin/violations", ShieldAlert],
  ["Events & Guests", "/admin/events", CalendarDays],
  ["Gate QR", "/admin/gate-qr", QrCode],
  ["Notifications", "/admin/notifications", Bell],
];
const Status = ({ value }) => (
  <span className={`status ${String(value).toLowerCase().replace(/\s/g, "-")}`}>
    {value}
  </span>
);
export function AdminLayout({ title, children }) {
  const [open, setOpen] = useState(false);
  const admin = useAuthenticatedUser();
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Link to="/admin/dashboard" className="logo">
          <span>P</span>ParkEase
        </Link>
        <b className="admin-label">ADMIN PANEL</b>
        <nav>
          {links.map(([name, path, Icon]) => (
            <NavLink to={path} key={path} onClick={() => setOpen(false)}>
              <Icon size={17} />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="admin-profile">
          <b>PA</b>
          <span>
            Parking Administrator
            <small>{admin?.email || "admin@parkease.com"}</small>
          </span>
          <button onClick={logoutMockUser}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        <header>
          <button onClick={() => setOpen(!open)}>
            <Menu />
          </button>
          <div>
            <h1>{title}</h1>
            <p>Monitor and manage campus parking from one place.</p>
          </div>
          <Link to="/admin/notifications">
            <Bell />
          </Link>
        </header>
        <section className="admin-content">{children}</section>
      </main>
    </div>
  );
}
const Stat = ({ label, value, icon: Icon }) => (
  <motion.article
    className="admin-stat"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Icon />
    <b>{value}</b>
    <span>{label}</span>
  </motion.article>
);
export function AdminDashboard() {
  const bookings = useBookings();
  const slots = [...makeSlots("Car"), ...makeSlots("Bike")];
  return (
    <AdminLayout title="Good morning, Admin">
      <div className="admin-stats">
        <Stat label="Total Parking Slots" value={slots.length} icon={MapPin} />
        <Stat label="Available Slots" value="72" icon={Car} />
        <Stat label="Currently Booked" value="18" icon={CalendarDays} />
        <Stat
          label="Active Parking"
          value={bookings.filter((b) => b.status === "Active").length}
          icon={Car}
        />
        <Stat
          label="Today's Bookings"
          value={bookings.length}
          icon={CalendarDays}
        />
        <Stat
          label="No-show / Expired"
          value={
            bookings.filter((b) => ["No-show", "Expired"].includes(b.status))
              .length
          }
          icon={CircleAlert}
        />
      </div>
      <section className="admin-card">
        <h2>Parking Overview</h2>
        <SlotOverview type="Car" />
        <SlotOverview type="Bike" />
        <p>
          Slot status is based on booking records and administrator updates.
        </p>
      </section>
      <section className="admin-card">
        <h2>Recent Activity</h2>
        {[
          "New booking PK-2026-00124",
          "Booking PK-2026-00120 completed",
          "Wrong parking report received for C12",
          "Guest parking enabled for Tech Fest",
        ].map((x, i) => (
          <p className="activity" key={x}>
            <small>{["10:32 AM", "10:18 AM", "09:52 AM", "09:30 AM"][i]}</small>
            {x}
          </p>
        ))}
      </section>
      <div className="admin-quick">
        {[
          ["Add Parking Slot", "/admin/slots"],
          ["View Bookings", "/admin/bookings"],
          ["Manage Users", "/admin/users"],
          ["View Reports", "/admin/reports"],
          ["Create Event", "/admin/events"],
        ].map(([x, to]) => (
          <Link key={x} to={to}>
            {x}
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
function SlotOverview({ type }) {
  const slots = makeSlots(type).slice(0, type === "Car" ? 30 : 60);
  return (
    <div className="admin-slot-overview">
      <b>{type.toUpperCase()} PARKING</b>
      <div>
        {slots.map((slot, i) => (
          <i
            key={slot.id}
            className={
              slot.unavailable
                ? "unavailable"
                : i % 11 === 0
                  ? "active"
                  : i % 6 === 0
                    ? "booked"
                    : ""
            }
          >
            {slot.id}
          </i>
        ))}
      </div>
    </div>
  );
}
export function SlotsPage() {
  const [slots, setSlots] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request("/slots")
      .then((data) => active && setSlots(data.slots || []))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  const shown = slots.filter((s) =>
    s.slotNumber.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <AdminLayout title="Manage Parking Slots">
      <div className="admin-toolbar">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search slot number"
          />
        </label>
        
      </div>
      <section className="admin-card admin-table">
        {loading ? <p>Loading parking slots...</p> : error ? <p>{error}</p> : shown.map((s) => (
          <article key={s._id}>
            <b>{s.slotNumber}</b>
            <span>{s.vehicleType}</span>
            <span>{s.zone}</span>
            <Status value={s.status === "disabled" ? "Unavailable" : "Available"} />
            <Link to={`/admin/parking-slots/edit/${s._id}`}>Edit</Link>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function EditSlotPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    request("/slots")
      .then((data) => {
        const selectedSlot = (data.slots || []).find((item) => item._id === id);
        if (!selectedSlot) throw new Error("Parking slot not found.");
        if (active) {
          setSlot(selectedSlot);
          setForm({ slotNumber: selectedSlot.slotNumber, vehicleType: selectedSlot.vehicleType, zone: selectedSlot.zone, notes: selectedSlot.notes || "", status: selectedSlot.status });
        }
      })
      .catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, [id]);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request(`/slots/${id}`, { method: "PUT", body: JSON.stringify(form) });
      navigate("/admin/slots");
    } catch (requestError) {
      setError(requestError.message);
    } finally { setSaving(false); }
  };
  return (
    <AdminLayout title="Edit Parking Slot">
      <form className="admin-card slot-edit-form" onSubmit={save}>
        <h2>{slot ? `Edit ${slot.slotNumber}` : "Edit Parking Slot"}</h2>
        {error && <p className="error">{error}</p>}
        {!form ? !error && <p>Loading parking slot...</p> : <>
        <label className="field"><span>Slot Number</span>
        <input
          value={form.slotNumber}
          onChange={(e) => setForm({ ...form, slotNumber: e.target.value.toUpperCase() })}
          placeholder="Slot Number"
        />
        </label>
        <label className="field"><span>Vehicle Type</span>
        <select
          value={form.vehicleType}
          onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
        >
          <option value="car">Car</option><option value="bike">Bike</option>
        </select>
        </label>
        <label className="field"><span>Zone</span>
        <select
          value={form.zone}
          onChange={(e) => setForm({ ...form, zone: e.target.value })}
        >
          {[
            "Student Zone",
            "Faculty Zone",
            "Academic Block",
            "Admin Block",
            "Library Block",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        </label>
        <label className="field"><span>Notes</span><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <label className="field"><span>Status</span><div className="choice-row">
          <button type="button" className={form.status === "available" ? "selected" : ""} onClick={() => setForm({ ...form, status: "available" })}>Available</button>
          <button type="button" className={form.status === "disabled" ? "selected" : ""} onClick={() => setForm({ ...form, status: "disabled" })}>Unavailable</button>
        </div></label>
        <div className="slot-edit-actions"><button type="button" onClick={() => navigate("/admin/slots")}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Slot"}</button></div>
        </>}
      </form>
    </AdminLayout>
  );
}
export function BookingsPage() {
  const bookings = useBookings();
  return (
    <AdminLayout title="Manage Bookings">
      <AdminSearch placeholder="Booking ID, user or slot" />
      <section className="admin-card admin-table">
        {bookings.map((b) => (
          <article key={b.id}>
            <b>{b.id}</b>
            <span>Vedika Pandey</span>
            <span>
              {b.vehicle} · {b.slot}
            </span>
            <span>
              {b.date}
              <small>
                {b.start} – {b.end}
              </small>
            </span>
            <Status value={b.status} />
            <Link to={`/admin/bookings/${b.id}`}>View</Link>
            {["Booked", "Grace Period"].includes(b.status) && (
              <button onClick={() => cancelBooking(b.id)}>Cancel</button>
            )}
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function AdminBookingDetails() {
  const b = getBookings().find((x) => x.id === useParams().id);
  return (
    <AdminLayout title="Booking Details">
      {b ? (
        <section className="admin-card details-grid">
          {Object.entries({
            "Booking ID": b.id,
            User: "Vedika Pandey",
            Role: "Student",
            "College ID": "0808CI241292",
            Email: "student@example.edu",
            Vehicle: b.number,
            Type: b.vehicle,
            Slot: b.slot,
            Zone: b.zone,
            Date: b.date,
            Time: `${b.start} – ${b.end}`,
            Status: b.status,
            Created: b.created,
          }).map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </section>
      ) : (
        <p>Booking not found.</p>
      )}
    </AdminLayout>
  );
}
const users = [
  {
    id: "u1",
    name: "Vedika Pandey",
    role: "Student",
    collegeId: "0808CI241292",
    email: "student@example.edu",
    mobile: "+91 98765 43210",
    status: "Active",
  },
  {
    id: "u2",
    name: "Aarav Sharma",
    role: "Faculty",
    collegeId: "FAC-208",
    email: "aarav@college.edu",
    mobile: "+91 98765 0011",
    status: "Active",
  },
];
export function UsersPage() {
  return (
    <AdminLayout title="Users">
      <AdminSearch placeholder="Name, college ID or email" />
      <section className="admin-card admin-table">
        {users.map((u) => (
          <article key={u.id}>
            <b>{u.name}</b>
            <span>{u.role}</span>
            <span>{u.collegeId}</span>
            <span>{u.email}</span>
            <Status value={u.status} />
            <Link to={`/admin/users/${u.id}`}>View</Link>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function UserDetails() {
  const u = users.find((x) => x.id === useParams().id) || users[0];
  return (
    <AdminLayout title="User Details">
      <section className="admin-card details-grid">
        {Object.entries({
          ...u,
          "Vehicle Number": "MP09XX0000",
          "Total Bookings": 4,
          "Completed Bookings": 1,
          "Cancelled Bookings": 1,
          "No-show Count": 0,
        }).map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <b>{v}</b>
          </div>
        ))}
      </section>
    </AdminLayout>
  );
}
export function ReportsPage() {
  return (
    <AdminLayout title="Parking Reports">
      <div className="admin-stats">
        {[
          ["Today’s Bookings", "24"],
          ["Weekly Bookings", "98"],
          ["Completed Bookings", "61"],
          ["Cancelled Bookings", "9"],
          ["No-show Bookings", "3"],
          ["Expired Bookings", "2"],
        ].map(([x, n]) => (
          <Stat key={x} label={x} value={n} icon={FileBarChart} />
        ))}
      </div>
      <section className="admin-card">
        <h2>Bookings by Day</h2>
        <div className="simple-chart">
          {[45, 68, 52, 80, 61, 74, 58].map((x, i) => (
            <i style={{ height: `${x}%` }} key={i} />
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
export function ViolationsPage() {
  const [reports, setReports] = useState([
    {
      id: "R-001",
      slot: "C12",
      type: "Wrong Parking",
      description: "Vehicle is blocking the marked bay.",
      by: "Vedika Pandey",
      status: "Pending",
    },
  ]);
  return (
    <AdminLayout title="Parking Issues & Reports">
      <section className="admin-card admin-table">
        {reports.map((r) => (
          <article key={r.id}>
            <b>{r.id}</b>
            <span>{r.slot}</span>
            <span>{r.type}</span>
            <span>{r.description}</span>
            <Status value={r.status} />
            <button
              onClick={() =>
                setReports(
                  reports.map((x) =>
                    x.id === r.id ? { ...x, status: "Under Review" } : x,
                  ),
                )
              }
            >
              Review
            </button>
            <button
              onClick={() =>
                setReports(
                  reports.map((x) =>
                    x.id === r.id ? { ...x, status: "Resolved" } : x,
                  ),
                )
              }
            >
              Resolve
            </button>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  return (
    <AdminLayout title="Events & Guest Parking">
      <div className="admin-toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="College event name"
        />
        <button
          onClick={() => {
            if (name) {
              setEvents([...events, { name, status: "Active" }]);
              setName("");
            }
          }}
        >
          <Plus />
          Create Event
        </button>
      </div>
      <section className="admin-card">
        {events.length ? (
          events.map((e) => (
            <article className="event-row" key={e.name}>
              <b>{e.name}</b>
              <span>20 Aug 2026 · 10:00 AM – 5:00 PM</span>
              <Status value={e.status} />
              <button
                onClick={() =>
                  setEvents(
                    events.map((x) =>
                      x.name === e.name
                        ? {
                            ...x,
                            status:
                              x.status === "Active" ? "Inactive" : "Active",
                          }
                        : x,
                    ),
                  )
                }
              >
                {e.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </article>
          ))
        ) : (
          <p>
            Guest parking is currently unavailable. Create and activate a
            college event to enable it.
          </p>
        )}
      </section>
    </AdminLayout>
  );
}
export function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await request("/notifications");
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await request(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await request("/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <AdminLayout title="Admin Notifications">
      <button className="session-primary" onClick={markAllAsRead}>
        Mark All as Read
      </button>

      <section className="admin-card">
        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              className={`activity notification-item ${
                notification.isRead ? "read" : "unread"
              }`}
              onClick={() => markAsRead(notification._id)}
            >
              {!notification.isRead && <i />}

              <span>
                <b>{notification.title}</b>
                <br />
                {notification.message}
              </span>

              <small>
                {new Date(notification.createdAt).toLocaleString("en-IN")}
              </small>
            </button>
          ))
        )}
      </section>
    </AdminLayout>
  );
}
export function GateQRPage() {
  return (
    <AdminLayout
      title="Gate QR"
      subtitle="Fixed QR code for parking entry verification."
    >
      <div className="admin-content">
        <section className="admin-card">
          <h2>ParkEase Entry Gate QR</h2>

          <p>
            Place this fixed QR code at the parking gate. Students will scan
            this QR from their ParkEase app to verify parking entry.
          </p>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <img
              src="/parkease-gate-qr.png"
              alt="ParkEase Gate QR"
              style={{
                width: "320px",
                maxWidth: "100%",
                borderRadius: "16px",
              }}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
function AdminSearch({ placeholder }) {
  return (
    <div className="admin-toolbar">
      <label>
        <Search />
        <input placeholder={placeholder} />
      </label>
    </div>
  );
}

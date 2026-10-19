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
  Users,
  QrCode,
} from "lucide-react";
import { useAuthenticatedUser, logoutMockUser } from "../services/authService";
import { request } from "../services/api";

const links = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Parking Slots", "/admin/slots", MapPin],
  ["Bookings", "/admin/bookings", CalendarDays],
  ["Users", "/admin/users", Users],
  ["Reports", "/admin/reports", FileBarChart],
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
  const [data, setData] = useState({ stats: {}, slots: [], bookings: [] });
  useEffect(() => {
    let active = true;
    const load = () => Promise.all([request("/admin/dashboard"), request("/slots"), request("/admin/bookings")])
      .then(([dashboard, slots, bookings]) => active && setData({ stats: dashboard.stats || {}, slots: slots.slots || [], bookings: bookings.bookings || [] }))
      .catch((error) => console.error("Admin dashboard error:", error));
    load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const { stats, slots, bookings } = data;
  return (
    <AdminLayout title="Good morning, Admin">
      <div className="admin-stats">
        <Stat label="Total Parking Slots" value={stats.totalSlots ?? "—"} icon={MapPin} />
        <Stat label="Available Slots" value={stats.availableSlots ?? "—"} icon={Car} />
        <Stat label="Currently Booked" value={stats.bookedSlots ?? "—"} icon={CalendarDays} />
        <Stat label="Active Parking" value={stats.occupiedSlots ?? "—"} icon={Car} />
        <Stat label="Today's Bookings" value={stats.todayBookings ?? "—"} icon={CalendarDays} />
        <Stat label="No-show / Expired" value={stats.noShowExpired ?? "—"} icon={CircleAlert} />
      </div>
      <section className="admin-card">
        <h2>Parking Overview</h2>
        <SlotOverview type="car" slots={slots} />
        <SlotOverview type="bike" slots={slots} />
        <p>
          Slot status is based on booking records and administrator updates.
        </p>
      </section>
      <section className="admin-card">
        <h2>Recent Activity</h2>
        {bookings.slice(0, 5).map((booking) => (
          <p className="activity" key={booking._id}>
            <small>{new Date(booking.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</small>
            Booking {booking.bookingId} · {booking.status}
          </p>
        ))}
      </section>
      <div className="admin-quick">
        {[
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
function SlotOverview({ type, slots }) {
  const shownSlots = slots.filter((slot) => slot.vehicleType === type);
  return (
    <div className="admin-slot-overview">
      <b>{type.toUpperCase()} PARKING</b>
      <div>
        {shownSlots.map((slot) => (
          <i
            key={slot._id}
            className={slot.availabilityStatus === "disabled" ? "unavailable" : slot.availabilityStatus === "occupied" ? "active" : slot.availabilityStatus === "booked" ? "booked" : ""}
          >
            {slot.slotNumber}
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
    const load = () => request("/slots")
      .then((data) => active && setSlots(data.slots || []))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const shown = slots.filter((s) =>
    s.slotNumber.toLowerCase().includes(query.toLowerCase()),
  );
  const setStatus = async (slot, status) => {
    try {
      const data = await request(`/slots/${slot._id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setSlots((current) => current.map((item) => item._id === slot._id ? { ...item, ...data.slot, availabilityStatus: status === "disabled" ? "disabled" : "available" } : item));
    } catch (requestError) { setError(requestError.message); }
  };
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
      <section className="admin-card admin-table admin-slot-table">
        {loading ? <p>Loading parking slots...</p> : error ? <p>{error}</p> : shown.map((s) => (
          <article key={s._id}>
            <b>{s.slotNumber}</b>
            <span>{s.vehicleType}</span>
            <div className="slot-status-actions">
              <button className={s.status === "available" ? "selected" : ""} onClick={() => setStatus(s, "available")}>Available</button>
              <button className={s.status === "disabled" ? "selected" : ""} onClick={() => setStatus(s, "disabled")}>Unavailable</button>
            </div>
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
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    let active = true;
    const load = () => request("/admin/bookings").then((data) => active && setBookings(data.bookings || [])).catch((error) => console.error("Admin bookings error:", error));
    load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return (
    <AdminLayout title="Manage Bookings">
      <AdminSearch placeholder="Booking ID, user or slot" />
      <section className="admin-card admin-table">
        {bookings.map((b) => (
          <article key={b._id}>
            <b>{b.bookingId}</b>
            <span>{b.user?.name || "—"}</span>
            <span>
              {b.vehicleType} · {b.slot?.slotNumber || "—"}
            </span>
            <span>
              {new Date(b.startTime).toLocaleDateString("en-IN")}
              <small>
                {new Date(b.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} – {new Date(b.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </small>
            </span>
            <Status value={b.status} />
            <Link to={`/admin/bookings/${b._id}`}>View</Link>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function AdminBookingDetails() {
  const { id } = useParams();
  const [b, setBooking] = useState(null);
  useEffect(() => { request("/admin/bookings").then((data) => setBooking((data.bookings || []).find((booking) => booking._id === id) || null)).catch((error) => console.error("Booking details error:", error)); }, [id]);
  return (
    <AdminLayout title="Booking Details">
      {b ? (
        <section className="admin-card details-grid">
          {Object.entries({
            "Booking ID": b.bookingId,
            User: b.user?.name || "—",
            Role: b.user?.role || "—",
            "College ID": b.user?.collegeId || b.user?.facultyId || "—",
            Email: b.user?.email || "—",
            Vehicle: b.vehicleNumber,
            Type: b.vehicleType,
            Slot: b.slot?.slotNumber || "—",
            Zone: b.slot?.zone || "—",
            Date: new Date(b.startTime).toLocaleDateString("en-IN"),
            Time: `${new Date(b.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} – ${new Date(b.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`,
            Status: b.status,
            Created: new Date(b.createdAt).toLocaleString("en-IN"),
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
export function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    let active = true;
    const load = () => request("/admin/users").then((data) => active && setUsers(data.users || [])).catch((error) => console.error("Admin users error:", error));
    load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return (
    <AdminLayout title="Users">
      <AdminSearch placeholder="Name, college ID or email" />
      <section className="admin-card admin-table">
        {users.map((u) => (
          <article key={u._id}>
            <b>{u.name}</b>
            <span>{u.role}</span>
            <span>{u.collegeId || u.facultyId || "—"}</span>
            <span>{u.email}</span>
            <Status value={u.isActive ? "Active" : "Inactive"} />
            <Link to={`/admin/users/${u._id}`}>View</Link>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
export function UserDetails() {
  const { id } = useParams();
  const [u, setUser] = useState(null);
  useEffect(() => { request("/admin/users").then((data) => setUser((data.users || []).find((user) => user._id === id) || null)).catch((error) => console.error("User details error:", error)); }, [id]);
  return (
    <AdminLayout title="User Details">
      {u ? <section className="admin-card details-grid">
        {Object.entries({
          ...u,
        }).map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <b>{v}</b>
          </div>
        ))}
      </section> : <p>Loading user...</p>}
    </AdminLayout>
  );
}
export function ReportsPage() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    let active = true;
    const load = () => request("/admin/bookings").then((data) => active && setBookings(data.bookings || [])).catch((error) => console.error("Reports error:", error));
    load(); const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const count = (predicate) => bookings.filter(predicate).length;
  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now); day.setDate(now.getDate() - (6 - index)); day.setHours(0, 0, 0, 0);
    const next = new Date(day); next.setDate(day.getDate() + 1);
    return count((booking) => new Date(booking.createdAt) >= day && new Date(booking.createdAt) < next);
  });
  const max = Math.max(...chart, 1);
  return (
    <AdminLayout title="Parking Reports">
      <div className="admin-stats">
        {[
          ["Today’s Bookings", count((booking) => new Date(booking.createdAt) >= startOfToday)],
          ["Weekly Bookings", bookings.length],
          ["Completed Bookings", count((booking) => booking.status === "completed")],
          ["Cancelled Bookings", count((booking) => booking.status === "cancelled")],
          ["No-show Bookings", count((booking) => booking.status === "no_show")],
          ["Expired Bookings", count((booking) => booking.status === "expired")],
        ].map(([x, n]) => (
          <Stat key={x} label={x} value={n} icon={FileBarChart} />
        ))}
      </div>
      <section className="admin-card">
        <h2>Bookings by Day</h2>
        <div className="simple-chart">
          {chart.map((value, i) => (
            <i style={{ height: `${Math.max(8, (value / max) * 100)}%` }} key={i} title={`${value} bookings`} />
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const loadEvents = () => request("/events").then((data) => setEvents(data.events || [])).catch((requestError) => setError(requestError.message));
  useEffect(() => { loadEvents(); const timer = window.setInterval(loadEvents, 15000); return () => window.clearInterval(timer); }, []);
  const createEvent = async () => {
    if (!name || !startDate || !endDate) return setError("Name, start date and end date are required.");
    try {
      await request("/events", { method: "POST", body: JSON.stringify({ name, startDate, endDate }) });
      setName(""); setStartDate(""); setEndDate(""); setError(""); loadEvents();
    } catch (requestError) { setError(requestError.message); }
  };
  const toggleEvent = async (event) => {
    try {
      await request(`/events/${event._id}`, { method: "PATCH", body: JSON.stringify({ status: event.status === "active" ? "completed" : "active", guestParkingEnabled: event.status !== "active" }) });
      loadEvents();
    } catch (requestError) { setError(requestError.message); }
  };
  return (
    <AdminLayout title="Events & Guest Parking">
      <div className="admin-toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="College event name"
        />
        <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={createEvent}>
          <Plus />
          Create Event
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <section className="admin-card">
        {events.length ? (
          events.map((e) => (
            <article className="event-row" key={e._id}>
              <b>{e.name}</b>
              <span>{new Date(e.startDate).toLocaleString("en-IN")} – {new Date(e.endDate).toLocaleString("en-IN")}</span>
              <Status value={e.status} />
              <button onClick={() => toggleEvent(e)}>
                {e.status === "active" ? "Deactivate" : "Activate"}
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
    const timer = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(timer);
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

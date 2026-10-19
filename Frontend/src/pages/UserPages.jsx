import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  History,
  UserRound,
  Bell,
  LogOut,
  Car,
  Bike,
  Clock3,
  ParkingCircle,
  ChevronRight,
  Check,
  Search,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Menu,
  AlertCircle,
} from "lucide-react";
import { currentUser, userBookings, mockNotifications } from "../data/mockData";
import { getSlotStatus, makeSlots } from "../services/parkingService";
import {
  cancelBooking,
  handleNoShow,
  useBookings,
} from "../services/bookingService";
import { request } from "../services/api";
import { useAuthenticatedUser } from "../services/authService";

const icon = { Car, Bike };
const nav = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Find Parking", "/parking", MapPin],
  ["My Bookings", "/my-bookings", CalendarDays],
  ["Booking History", "/booking-history", History],
  ["Profile", "/profile", UserRound],
  ["Notifications", "/notifications", Bell],
];
const statusClass = (s) => `status ${s.toLowerCase().replace(/\s/g, "-")}`;
const displayStatus = (status) => ({ booked: "Booked", active: "Active", completed: "Completed", cancelled: "Cancelled", no_show: "No-show", expired: "Expired" }[status] || status);
const asBooking = (booking) => ({
  id: booking._id,
  bookingId: booking.bookingId,
  slot: booking.slot?.slotNumber || "—",
  zone: booking.slot?.zone || "—",
  vehicle: booking.vehicleType === "car" ? "Car" : "Bike",
  number: booking.vehicleNumber,
  date: new Date(booking.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  start: new Date(booking.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
  end: new Date(booking.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
  status: displayStatus(booking.status),
  rawStatus: booking.status,
  created: new Date(booking.createdAt).toLocaleString("en-IN"),
});
const initials = (name = "User") => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
export function UserLayout({ children, title, subtitle }) {
  const [open, setOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const user = useAuthenticatedUser();
  const name = user?.name || "User";
  useEffect(() => {
    let active = true;
    const checkUnread = () => request("/notifications")
      .then((data) => active && setHasUnreadNotifications((data.notifications || []).some((notification) => !notification.isRead)))
      .catch(() => active && setHasUnreadNotifications(false));
    checkUnread();
    const timer = window.setInterval(checkUnread, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return (
    <div className="user-app">
      <aside className={"user-sidebar " + (open ? "open" : "")}>
        <Link to="/dashboard" className="logo">
          <span>
            <ParkingCircle size={20} />
          </span>
          ParkEase
        </Link>
        <nav>
          {nav.map(([n, p, I]) => (
            <NavLink key={p} to={p} onClick={() => setOpen(false)}>
              <I size={18} />
              {n}
            </NavLink>
          ))}
        </nav>
        <div className="user-side-bottom">
          <div className="mini-user">
            <b>{initials(name)}</b>
            <span>
              {name}
              <small>{user?.role || "User"}</small>
            </span>
          </div>
          <Link to="/">
            <LogOut size={17} />
            Logout
          </Link>
        </div>
      </aside>
      <main className="user-main">
        <header className="user-top">
          <button className="user-menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Link to="/notifications" className="bell">
            <Bell size={20} />
            {hasUnreadNotifications && <i />}
          </Link>
          <Link to="/profile" className="top-avatar">{initials(name)}</Link>
        </header>
        {children}
      </main>
      <AnimatePresence>
        {open && (
          <motion.div
            className="side-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
function Status({ value }) {
  return <span className={statusClass(value)}>{value}</span>;
}
function Icon({ type }) {
  const I = icon[type] || Car;
  return <I size={20} />;
}
function Action({ to, type, title, text }) {
  return (
    <Link to={to} className="quick-card">
      <span>
        <Icon type={type} />
      </span>
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <ChevronRight size={18} />
    </Link>
  );
}
function SlotGrid({ compact = false, slots = [] }) {
  const cars = slots.filter((slot) => slot.vehicleType === "car").slice(0, 8),
    bikes = slots.filter((slot) => slot.vehicleType === "bike").slice(0, 8);
  return (
    <div className="glance">
      {[
        ["CAR PARKING", cars],
        ["BIKE PARKING", bikes],
      ].map(([name, typeSlots]) => (
        <div key={name}>
          <div className="glance-head">
            <b>{name}</b>
            <span>Booking-based availability</span>
          </div>
          <div className="mini-slots">
            {typeSlots.map((s) => (
              <span className={s.availabilityStatus === "available" && s.status !== "disabled" ? "" : "taken"} key={s._id}>
                {s.slotNumber}
              </span>
            ))}
          </div>
        </div>
      ))}
      {!compact && <small>Availability is based on current bookings.</small>}
    </div>
  );
}
function AvailabilityGrid({ type, date, time, selected, onSelect }) {
  const end = String(Number(time.slice(0, 2)) + 1).padStart(2, "0") + ":00";
  const slots = makeSlots(type);
  return (
    <div className="glance">
      <div className="glance-head">
        <b>{type.toUpperCase()} PARKING</b>
        <span>
          {
            slots.filter(
              (s) => getSlotStatus(s, date, time, end) === "available",
            ).length
          }{" "}
          available
        </span>
      </div>
      <div className="mini-slots availability-slots">
        {slots.map((slot) => {
          const state =
            selected === slot.id
              ? "selected"
              : getSlotStatus(slot, date, time, end);
          return (
            <button
              type="button"
              className={state === "booked" ? "taken" : state}
              onClick={() => state === "available" && onSelect(slot.id)}
              key={slot.id}
            >
              {slot.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export function Dashboard() {
  const user = useAuthenticatedUser();
  const [data, setData] = useState({ bookings: [], slots: [], notifications: [] });
  useEffect(() => {
    let active = true;
    Promise.all([request("/bookings/my"), request("/slots"), request("/notifications")])
      .then(([bookings, slots, notifications]) => active && setData({ bookings: bookings.bookings || [], slots: slots.slots || [], notifications: notifications.notifications || [] }))
      .catch((error) => console.error("Dashboard data error:", error));
    return () => { active = false; };
  }, []);
  const bookings = data.bookings.map(asBooking);
  const now = new Date();
  const up = data.bookings
    .filter((booking) => ["booked", "active"].includes(booking.status) && new Date(booking.endTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map(asBooking)[0];
  const activeBooking = data.bookings.filter((booking) => booking.status === "active").map(asBooking)[0];
  const available = (type) => data.slots.filter((slot) => slot.vehicleType === type && slot.status === "available").length;
  return (
    <UserLayout
      title={`Good morning, ${(user?.name || "User").split(" ")[0]} 👋`}
      subtitle="Manage your campus parking easily with ParkEase."
    >
      <div className="user-content">
        <div className="date-note">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        <motion.section
          className="stat-grid"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {[
            [Car, available("car"), "Available Car Slots"],
            [Bike, available("bike"), "Available Bike Slots"],
            [CalendarDays, up ? "1" : "0", "Upcoming Booking"],
            [Clock3, activeBooking ? "1" : "—", "Active Parking"],
          ].map(([I, n, l]) => (
            <motion.article
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              key={l}
            >
              <I />
              <b>{n}</b>
              <span>{l}</span>
            </motion.article>
          ))}
        </motion.section>
        <div className="dash-grid">
          <section className="upcoming-panel">
            <div className="section-title">
              <div>
                <span>UPCOMING BOOKING</span>
                <h2>Your next campus space</h2>
              </div>
              {up && <Status value={up.status} />}
            </div>
            {up ? <>
            <div className="booking-highlight">
              <div className="booking-vehicle">
                <Car />
              </div>
              <div>
                <h3>
                  {up.slot} · {up.zone}
                </h3>
                <p>
                  {up.bookingId} · {up.vehicle} · {up.number}
                </p>
                <div className="booking-meta">
                  <span>
                    <CalendarDays /> {up.date}
                  </span>
                  <span>
                    <Clock3 /> {up.start} – {up.end}
                  </span>
                </div>
              </div>
            </div>
            <div className="booking-buttons">
  <Link to={`/booking/${up.id}`}>View Booking</Link>
  <Link to="/entry-verification">Scan Entry QR</Link>
            </div></> : <Empty text="No upcoming booking." />}
          </section>
          <section className="active-panel">
            <Clock3 />
            <h2>{activeBooking ? `Active: ${activeBooking.slot}` : "No Active Parking"}</h2>
            <p>
              Once you start parking, your active parking session will appear
              here.
            </p>
            <Link to="/parking">
              Find Parking <ChevronRight size={16} />
            </Link>
          </section>
        </div>
        <section>
          <div className="section-title">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>Get moving</h2>
            </div>
          </div>
          <div className="quick-grid">
            <Action
              to="/parking/car"
              type="Car"
              title="Book Car Parking"
              text="Reserve a campus car bay"
            />
            <Action
              to="/parking/bike"
              type="Bike"
              title="Book Bike Parking"
              text="Find a two-wheeler bay"
            />
            <Action
              to="/my-bookings"
              type="Car"
              title="My Bookings"
              text="Manage upcoming visits"
            />
            <Action
              to="/booking-history"
              type="Bike"
              title="Booking History"
              text="Review previous parking"
            />
          </div>
        </section>
        <div className="dash-grid lower">
          <section className="surface recent">
            <div className="section-title">
              <h2>Recent Bookings</h2>
              <Link to="/my-bookings">View all</Link>
            </div>
            <BookingTable bookings={bookings.slice(0, 3)} />
          </section>
          <section className="surface">
            <div className="section-title">
              <h2>Parking at a glance</h2>
              <Link to="/parking-status">View status</Link>
            </div>
          <SlotGrid slots={data.slots} />
          </section>
        </div>
        <section className="surface notifications-preview">
          <div className="section-title">
            <h2>Recent Notifications</h2>
            <Link to="/notifications">View All Notifications</Link>
          </div>
          {data.notifications.slice(0, 3).map((n) => (
            <Notice key={n._id} n={{ ...n, id: n._id, unread: !n.isRead }} />
          ))}
        </section>
      </div>
    </UserLayout>
  );
}
export function BookingTable({ bookings, action = true }) {
  return (
    <div className="booking-table">
      <div className="table-head">
        <span>Booking ID</span>
        <span>Slot</span>
        <span>Vehicle</span>
        <span>Date & Time</span>
        <span>Status</span>
        {action && <span />}
      </div>
      {bookings.map((b) => (
        <div className="table-row" key={b.id}>
          <span>
            <b>{b.bookingId || b.id}</b>
          </span>
          <span>{b.slot}</span>
          <span>
            <Icon type={b.vehicle} />
            {b.vehicle}
          </span>
          <span>
            {b.date}
            <small>
              {b.start} – {b.end}
            </small>
          </span>
          <Status value={b.status} />
          {action && <Link to={`/booking/${b.id}`}>Details</Link>}
        </div>
      ))}
    </div>
  );
}
export function MyBookings() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const loadBookings = () => request("/bookings/my").then((data) => setItems((data.bookings || []).map(asBooking))).catch((error) => console.error("Bookings error:", error));
  useEffect(() => { loadBookings(); }, []);
  const matching = items.filter(
    (b) =>
      filter === "All" ||
      (filter === "Upcoming"
        ? ["Booked", "Active"].includes(b.status)
        : b.status === filter),
  );
  const cancel = async (id) => {
    try {
      await request(`/bookings/${id}/cancel`, { method: "PATCH" });
      loadBookings();
    } catch (error) { window.alert(error.message); }
  };
  return (
    <UserLayout
      title="My Bookings"
      subtitle="View and manage your upcoming campus parking bookings."
    >
      <div className="user-content">
        <Tabs
          value={filter}
          set={setFilter}
          values={[
            "All",
            "Upcoming",
            "Active",
            "Completed",
            "Cancelled",
            "Expired",
            "No-show",
          ]}
        />
        <div className="booking-list">
          {matching.length ? (
            matching.map((b) => (
              <motion.article
                className="booking-card"
                whileHover={{ y: -3 }}
                key={b.id}
              >
                <div className="card-booking-head">
                  <div>
                    <span className="booking-vehicle">
                      <Icon type={b.vehicle} />
                    </span>
                    <div>
                      <b>{b.bookingId}</b>
                      <p>
                        {b.vehicle} · {b.number}
                      </p>
                    </div>
                  </div>
                  <Status value={b.status} />
                </div>
                <div className="booking-card-info">
                  <span>
                    <small>SLOT & ZONE</small>
                    {b.slot} · {b.zone}
                  </span>
                  <span>
                    <small>DATE & TIME</small>
                    {b.date}
                    <em>
                      {b.start} – {b.end}
                    </em>
                  </span>
                </div>
                <div className="card-actions">
                  <Link to={`/booking/${b.id}`}>View Details</Link>
                  {["Booked", "Grace Period"].includes(b.status) && (
                    <>
                 <Link to="/entry-qr">
                  Scan Entry QR
                </Link>
                      <button onClick={() => cancel(b.id)}>
                        Cancel Booking
                      </button>
                    </>
                  )}
                  {b.status === "Active" && (
                    <>
                      <Link to="/active-parking">View Parking</Link>
                      <Link to="/active-parking">Extend / End</Link>
                    </>
                  )}
                  {b.status === "Grace Period" && (
                    <button onClick={() => handleNoShow(b.id)}>
                      Simulate no-show
                    </button>
                  )}
                </div>
              </motion.article>
            ))
          ) : (
            <Empty text={`No ${filter.toLowerCase()} bookings found.`} />
          )}
        </div>
      </div>
    </UserLayout>
  );
}
function Tabs({ value, set, values }) {
  return (
    <div className="filter-tabs">
      {values.map((v) => (
        <button
          key={v}
          className={value === v ? "active" : ""}
          onClick={() => set(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty-state">
      <ParkingCircle />
      <h2>Nothing to show yet</h2>
      <p>{text}</p>
      <Link to="/parking">Find Parking</Link>
    </div>
  );
}
function Notice({ n, onRead }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (n.unread) {
      await onRead?.(n.id);
    }

    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <article
      className={"notice " + (n.unread ? "unread" : "")}
      onClick={handleClick}
      style={{ cursor: n.link ? "pointer" : "default" }}
    >
      <span>
        <Bell size={17} />
      </span>

      <div>
        <b>{n.title}</b>
        <p>{n.message}</p>
      </div>

      <small>
        {n.createdAt
          ? new Date(n.createdAt).toLocaleString("en-IN")
          : n.time}
      </small>
    </article>
  );
}
export function BookingDetails() {
  const { id } = useParams();
  const [b, setBooking] = useState(
    () => userBookings.find((x) => x.id === id) || userBookings[0],
  );
  const [qr, setQr] = useState(false);
  return (
    <UserLayout
      title="Booking Details"
      subtitle="Your campus parking reservation at a glance."
    >
      <div className="user-content details-page">
        <Link className="back-link" to="/my-bookings">
          ← Back to My Bookings
        </Link>
        <section className="detail-card">
          <div className="section-title">
            <div>
              <span>BOOKING ID</span>
              <h2>{b.id}</h2>
            </div>
            <Status value={b.status} />
          </div>
          <div className="details-grid">
            {[
              ["Vehicle", b.vehicle],
              ["Vehicle Number", b.number],
              ["Vehicle Type", b.vehicle],
              ["Parking Slot", b.slot],
              ["Zone", b.zone],
              ["Date", b.date],
              ["Start", b.start],
              ["End", b.end],
              ["Booking Created", b.created],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="surface timeline">
          <h2>Booking timeline</h2>
          {[
            "Booking Created",
            "Slot Reserved",
            "Entry",
            "Parking",
            "Completed",
          ].map((x, i) => (
            <div className={i < 2 ? "done" : ""} key={x}>
              <i>{i < 2 ? <Check size={12} /> : i + 1}</i>
              <span>
                <b>{x}</b>
                <small>{i < 2 ? "Complete" : "Pending"}</small>
              </span>
            </div>
          ))}
        </section>
        <div className="detail-actions">
  <Link to="/my-bookings">Back to My Bookings</Link>

  {b.status === "Booked" && (
    <button onClick={() => setBooking({ ...b, status: "Cancelled" })}>
      Cancel Booking
    </button>
  )}

  <Link to="/entry-verification">Scan Entry QR</Link>
</div>
      </div>
      <AnimatePresence>
        {qr && (
          <div className="modal-wrap">
            <motion.div
              className="mock-modal"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <button className="modal-close" onClick={() => setQr(false)}>
                <X />
              </button>
              <ParkingCircle />
              <h2>QR will be available in the next stage</h2>
              <button onClick={() => setQr(false)}>Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UserLayout>
  );
}
export function HistoryPage() {
  const [search, setSearch] = useState(""),
    [type, setType] = useState("All"),
    [status, setStatus] = useState("All"),
    [date, setDate] = useState("All dates");
  const [items, setItems] = useState([]);
  useEffect(() => {
    request("/bookings/my").then((data) => setItems((data.bookings || []).map(asBooking))).catch((error) => console.error("History error:", error));
  }, []);
  const rows = items.filter(
    (b) =>
      (type === "All" || b.vehicle === type) &&
      (status === "All" || b.status === status) &&
      (date === "All dates" || b.date === date) &&
      `${b.bookingId} ${b.slot} ${b.number}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <UserLayout
      title="Booking History"
      subtitle="Keep track of your previous campus parking activity."
    >
      <div className="user-content">
        <div className="history-filters">
          <label>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Booking ID, slot or vehicle number"
            />
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>All</option>
            <option>Car</option>
            <option>Bike</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Completed</option>
            <option>Cancelled</option>
            <option>Expired</option>
            <option>No-show</option>
          </select>
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            <option>All dates</option>
            {[...new Set(items.map((b) => b.date))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <section className="surface">
          <BookingTable bookings={rows} action={false} />
          {!rows.length && (
            <Empty text="Try adjusting your search or filters." />
          )}
        </section>
      </div>
    </UserLayout>
  );
}
export function ProfilePage() {
  const [edit, setEdit] = useState(false),
    [profile, setProfile] = useState(null);
  useEffect(() => {
    request("/auth/me").then((data) => setProfile(data.user)).catch((error) => console.error("Profile error:", error));
  }, []);
  const fields = [
    ["Full Name", "name"],
    ["College Email", "email"],
    ["Mobile Number", "mobile"],
  ];
  const saveProfile = async () => {
    try {
      const data = await request("/auth/me", { method: "PUT", body: JSON.stringify({ name: profile.name, mobile: profile.mobile || "" }) });
      setProfile(data.user);
      setEdit(false);
    } catch (error) { window.alert(error.message); }
  };
  if (!profile) return <UserLayout title="Profile"><div className="user-content"><p>Loading profile...</p></div></UserLayout>;
  return (
    <UserLayout
      title="Profile"
      subtitle="Manage your ParkEase account and campus parking details."
    >
      <div className="user-content">
        <section className="profile-hero">
          <div className="profile-avatar">{initials(profile.name)}</div>
          <div>
            <h2>{profile.name}</h2>
            <p>
              {profile.role} · {profile.collegeId || profile.facultyId || "—"}
            </p>
            <span>{profile.email}</span>
          </div>
          <button onClick={() => edit ? saveProfile() : setEdit(true)}>
            {edit ? "Save Profile" : "Edit Profile"}
          </button>
        </section>
        <ProfileSection
          title="Personal Information"
          fields={fields}
          profile={profile}
          setProfile={setProfile}
          edit={edit}
        />
        <ProfileSection
          title="College Information"
          fields={[
            ["Role", "role"],
            ["Enrollment / Computer Code", profile.role === "faculty" ? "facultyId" : "collegeId"],
          ]}
          profile={profile}
        />
        <section className="profile-section">
          <h2>Parking Information</h2>
          <div className="profile-info">
            <div>
              <small>Vehicle Number</small>
              <b>Selected while making a booking</b>
            </div>
            <div className="profile-note">
              <AlertCircle size={17} />
              Vehicle type is selected when making a parking booking.
            </div>
          </div>
        </section>
        <Link className="password-btn" to="/change-password">
          <ShieldCheck size={17} />
          Change Password
        </Link>
      </div>
    </UserLayout>
  );
}
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError("New password and confirmation do not match.");
    setSaving(true); setError("");
    try {
      await request("/auth/me/password", { method: "PUT", body: JSON.stringify(form) });
      navigate("/profile");
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  return <UserLayout title="Change Password" subtitle="Keep your ParkEase account secure."><div className="user-content"><form className="surface password-page" onSubmit={submit}>
    <Link className="back-link" to="/profile">← Back to Profile</Link><h2>Update your password</h2>
    <label className="field"><span>Current Password</span><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required /></label>
    <label className="field"><span>New Password</span><input type="password" minLength="6" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required /></label>
    <label className="field"><span>Confirm New Password</span><input type="password" minLength="6" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>
    {error && <p className="error">{error}</p>}<button className="password-btn" type="submit" disabled={saving}>{saving ? "Changing..." : "Change Password"}</button><Link className="text-link password-forgot" to="/forgot-password">Forgot password?</Link>
  </form></div></UserLayout>;
}
export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      if (token) {
        if (newPassword !== confirmPassword) throw new Error("New password and confirmation do not match.");
        const data = await request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) });
        setMessage(data.message);
      } else {
        const data = await request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
        setMessage(data.message);
      }
    } catch (error) { setMessage(error.message); }
  };
  return <div className="user-app"><main className="user-main"><section className="user-content"><form className="surface password-page" onSubmit={submit}><h1>{token ? "Reset Password" : "Forgot Password"}</h1><p>{token ? "Choose a new password for your account." : "Enter your account email to receive reset instructions."}</p>
    {token ? <><label className="field"><span>New Password</span><input type="password" minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></label><label className="field"><span>Confirm New Password</span><input type="password" minLength="6" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label></> : <label className="field"><span>College Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>}
    {message && <p>{message}</p>}<button className="password-btn" type="submit">{token ? "Reset Password" : "Send Reset Instructions"}</button><Link className="text-link password-forgot" to="/login">Back to Sign In</Link></form></section></main></div>;
}
function ProfileSection({ title, fields, profile, setProfile, edit = false }) {
  return (
    <section className="profile-section">
      <h2>{title}</h2>
      <div className="profile-info">
        {fields.map(([label, key]) => (
          <div key={key}>
            <small>{label}</small>
            {edit ? (
              <input
                value={profile[key]}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
              />
            ) : (
              <b>{profile[key]}</b>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
export function NotificationsPage() {
 const [items, setItems] = useState([]),
  [tab, setTab] = useState("All"),
  [loading, setLoading] = useState(true);
  useEffect(() => {
  const loadNotifications = async () => {
    try {
      const data = await request("/notifications");
      {
        setItems(
          (data.notifications || []).map((n) => ({
            ...n,
            id: n._id,
            unread: !n.isRead,
            category:
              n.type === "booking"
                ? "Bookings"
                : ["parking", "reminder"].includes(n.type)
                  ? "Parking"
                  : "System",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  loadNotifications();
  const refreshTimer = window.setInterval(loadNotifications, 30000);
  return () => window.clearInterval(refreshTimer);
}, []);
  const shown = items.filter(
    (n) => tab === "All" || (tab === "Unread" ? n.unread : n.category === tab),
  );
  const markRead = async (id) => {
  try {
    await request(`/notifications/${id}/read`, { method: "PATCH" });
    {
      setItems((current) =>
        current.map((n) =>
          n.id === id ? { ...n, unread: false, isRead: true } : n
        )
      );
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
};
  return (
    <UserLayout
      title="Notifications"
      subtitle="Stay updated on your campus parking activity."
    >
      <div className="user-content">
        <div className="notifications-tools">
          <Tabs
            value={tab}
            set={setTab}
            values={["All", "Unread", "Bookings"]}
          />
          <button
  onClick={async () => {
    try {
      await request("/notifications/read-all", { method: "PATCH" });
      {
        setItems((current) =>
          current.map((n) => ({
            ...n,
            unread: false,
            isRead: true,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }}
>
  Mark all as read
</button>
        </div>
        <section className="surface notification-list">
          {shown.length ? shown.map((n) => (
            <Notice n={n} onRead={markRead} key={n.id} />
          )) : !loading && <Empty text="No notifications to show." />}
        </section>
      </div>
    </UserLayout>
  );
}
export function ParkingStatus() {
  const [date, setDate] = useState("2026-09-12"),
    [time, setTime] = useState("10:00"),
    [selected, setSelected] = useState("");
  const end = String(Number(time.slice(0, 2)) + 1).padStart(2, "0") + ":00";
  const summary = (type) => {
    const slots = makeSlots(type);
    const booked = slots.filter(
      (s) => getSlotStatus(s, date, time, end) === "booked",
    ).length;
    return {
      available:
        slots.length - booked - slots.filter((s) => s.unavailable).length,
      booked,
    };
  };
  const car = summary("Car"),
    bike = summary("Bike");
  return (
    <UserLayout
      title="Parking Status"
      subtitle="See booking-based availability across campus parking zones."
    >
      <div className="user-content">
        <div className="status-controls">
          <label>
            Date
            <select
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelected("");
              }}
            >
              <option value="2026-09-12">12 Sep 2026</option>
              <option value="2026-09-13">13 Sep 2026</option>
              <option value="2026-09-14">14 Sep 2026</option>
              <option value="2026-09-15">15 Sep 2026</option>
            </select>
          </label>
          <label>
            Time
            <select
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setSelected("");
              }}
            >
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">2:00 PM</option>
            </select>
          </label>
        </div>
        <section className="availability-summary">
          <article>
            <Car />
            <b>{car.available}</b>
            <span>Car slots available</span>
            <small>{car.booked} booked</small>
          </article>
          <article>
            <Bike />
            <b>{bike.available}</b>
            <span>Bike slots available</span>
            <small>{bike.booked} booked</small>
          </article>
        </section>
        <section className="surface status-slots">
          <div className="section-title">
            <div>
              <h2>Campus parking map</h2>
              <p>
                Green: Available · Red: Booked · Blue: Selected · Grey:
                Unavailable
              </p>
            </div>
          </div>
          <AvailabilityGrid
            type="Car"
            date={date}
            time={time}
            selected={selected}
            onSelect={setSelected}
          />
          <AvailabilityGrid
            type="Bike"
            date={date}
            time={time}
            selected={selected}
            onSelect={setSelected}
          />
        </section>
        <p className="availability-note">
          Availability is based on booking records for the selected date and
          time.
        </p>
      </div>
    </UserLayout>
  );
}

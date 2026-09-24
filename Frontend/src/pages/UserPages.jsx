import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
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
export function UserLayout({ children, title, subtitle }) {
  const [open, setOpen] = useState(false);
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
            <b>VP</b>
            <span>
              {currentUser.firstName}
              <small>{currentUser.role}</small>
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
            <i />
          </Link>
          <div className="top-avatar">VP</div>
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
function SlotGrid({ compact = false }) {
  const cars = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08"],
    bikes = ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08"];
  return (
    <div className="glance">
      {[
        ["CAR PARKING", cars],
        ["BIKE PARKING", bikes],
      ].map(([name, slots]) => (
        <div key={name}>
          <div className="glance-head">
            <b>{name}</b>
            <span>Booking-based availability</span>
          </div>
          <div className="mini-slots">
            {slots.map((s, i) => (
              <span className={i === 4 || i === 1 ? "taken" : ""} key={s}>
                {s}
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
  const [qr, setQr] = useState(false);
  const up = userBookings[0];
  return (
    <UserLayout
      title={`Good morning, ${currentUser.firstName} 👋`}
      subtitle="Manage your campus parking easily with ParkEase."
    >
      <div className="user-content">
        <div className="date-note">Sunday, 13 September 2026</div>
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
            [Car, "24", "Available Car Slots"],
            [Bike, "48", "Available Bike Slots"],
            [CalendarDays, "Today", "Upcoming Booking"],
            [Clock3, "—", "Active Parking"],
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
              <Status value="Booked" />
            </div>
            <div className="booking-highlight">
              <div className="booking-vehicle">
                <Car />
              </div>
              <div>
                <h3>
                  {up.slot} · {up.zone}
                </h3>
                <p>
                  {up.id} · {up.vehicle} · {up.number}
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
</div>
          </section>
          <section className="active-panel">
            <Clock3 />
            <h2>No Active Parking</h2>
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
            <BookingTable bookings={userBookings.slice(0, 3)} />
          </section>
          <section className="surface">
            <div className="section-title">
              <h2>Parking at a glance</h2>
              <Link to="/parking-status">View status</Link>
            </div>
            <SlotGrid />
          </section>
        </div>
        <section className="surface notifications-preview">
          <div className="section-title">
            <h2>Recent Notifications</h2>
            <Link to="/notifications">View All Notifications</Link>
          </div>
          {mockNotifications.slice(0, 3).map((n) => (
            <Notice key={n.id} n={n} />
          ))}
        </section>
      </div>
      <AnimatePresence>
        {qr && (
          <div className="modal-wrap">
            <motion.div
              className="mock-modal"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
            >
              <button className="modal-close" onClick={() => setQr(false)}>
                <X />
              </button>
              <ParkingCircle />
              <h2>Entry QR is coming soon</h2>
              <p>
                QR entry will be available after confirmation in a future stage.
              </p>
              <button onClick={() => setQr(false)}>Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
            <b>{b.id.replace("2026-", "")}</b>
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
  const items = useBookings();
  const [filter, setFilter] = useState("All");
  const matching = items.filter(
    (b) =>
      filter === "All" ||
      (filter === "Upcoming"
        ? ["Booked", "Grace Period"].includes(b.status)
        : b.status === filter),
  );
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
                      <b>{b.id}</b>
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
                      <button onClick={() => cancelBooking(b.id)}>
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
  const rows = userBookings.filter(
    (b) =>
      (type === "All" || b.vehicle === type) &&
      (status === "All" || b.status === status) &&
      (date === "All dates" || b.date === date) &&
      `${b.id} ${b.slot} ${b.number}`
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
            {[...new Set(userBookings.map((b) => b.date))].map((d) => (
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
    [passwordOpen, setPasswordOpen] = useState(false),
    [profile, setProfile] = useState(currentUser);
  const fields = [
    ["Full Name", "name"],
    ["College Email", "email"],
    ["Mobile Number", "phone"],
  ];
  return (
    <UserLayout
      title="Profile"
      subtitle="Manage your ParkEase account and campus parking details."
    >
      <div className="user-content">
        <section className="profile-hero">
          <div className="profile-avatar">VP</div>
          <div>
            <h2>{profile.name}</h2>
            <p>
              {profile.role} · {profile.collegeId}
            </p>
            <span>{profile.email}</span>
          </div>
          <button onClick={() => setEdit(!edit)}>
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
            ["Enrollment / Computer Code", "collegeId"],
          ]}
          profile={profile}
        />
        <section className="profile-section">
          <h2>Parking Information</h2>
          <div className="profile-info">
            <div>
              <small>Vehicle Number</small>
              <b>{profile.vehicle}</b>
            </div>
            <div className="profile-note">
              <AlertCircle size={17} />
              Vehicle type is selected when making a parking booking.
            </div>
          </div>
        </section>
        <button className="password-btn" onClick={() => setPasswordOpen(true)}>
          <ShieldCheck size={17} />
          Change Password
        </button>
      </div>
      <AnimatePresence>
        {passwordOpen && (
          <div className="modal-wrap">
            <motion.div
              className="mock-modal"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
            >
              <button
                className="modal-close"
                onClick={() => setPasswordOpen(false)}
              >
                <X />
              </button>
              <ShieldCheck />
              <h2>Change Password</h2>
              <p>
                Password updating will be connected when authentication is added
                in the next stage.
              </p>
              <button onClick={() => setPasswordOpen(false)}>Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UserLayout>
  );
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
      const token = localStorage.getItem("parkease_token");

      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setItems(
          (data.notifications || []).map((n) => ({
            ...n,
            id: n._id,
            unread: !n.isRead,
            category:
              n.type === "booking"
                ? "Bookings"
                : n.type === "parking"
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
}, []);
  const shown = items.filter(
    (n) => tab === "All" || (tab === "Unread" ? n.unread : n.category === tab),
  );
  const markRead = async (id) => {
  try {
    const token = localStorage.getItem("parkease_token");

    const response = await fetch(
      `http://localhost:5000/api/notifications/${id}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
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
            values={["All", "Unread", "Bookings", "Parking", "System"]}
          />
          <button
  onClick={async () => {
    try {
      const token = localStorage.getItem("parkease_token");

      const response = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
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
          {shown.map((n) => (
            <Notice n={n} onRead={markRead} key={n.id} />
          ))}
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

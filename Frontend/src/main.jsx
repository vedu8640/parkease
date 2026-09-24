import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  NavLink,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  Bike,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  MapPin,
  Menu,
  ParkingCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import "./styles.css";
import {
  BookingPage,
  ConfirmationPage,
  DashboardPage,
  ParkingPage,
} from "./pages/ParkingPages";
import { NewGuest, NewLogin, NewRegisterV2 } from "./pages/AuthPages";
import {
  Dashboard,
  MyBookings,
  BookingDetails,
  HistoryPage,
  ProfilePage,
  NotificationsPage,
  ParkingStatus,
} from "./pages/UserPages";
import {
  ActiveParkingPage,
  AssignedSlotPage,
  BookingQRCode,
  EntryVerification,
} from "./pages/SessionPages";
import { useAuthenticatedUser } from "./services/authService";
import {
  AdminBookingDetails,
  AdminDashboard,
  AdminNotifications,
  EditSlotPage,
  GateQRPage,
  BookingsPage,
  EventsPage,
  ReportsPage,
  SlotsPage,
  UserDetails,
  UsersPage,
  ViolationsPage,
  
} from "./pages/AdminPages";

const featureData = [
  [
    "Easy Slot Booking",
    "Reserve a suitable parking slot for your selected time.",
    CalendarDays,
  ],
  [
    "Time-Slot Management",
    "Plan parking around lectures, labs and campus schedules.",
    Clock3,
  ],
  [
    "QR-Based Entry",
    "Use your booking QR for verified parking entry.",
    ShieldCheck,
  ],
  [
    "Flexible Parking",
    "Choose the right space for your car or two-wheeler.",
    Car,
  ],
  [
    "Booking History",
    "Keep a simple record of your campus parking activity.",
    CreditCard,
  ],
  [
    "Centralized Management",
    "Help campus teams coordinate spaces and bookings.",
    MapPin,
  ],
];
const steps = [
  [
    "01",
    "Find Your Slot",
    "See car and bike parking zones designed for campus life.",
    MapPin,
  ],
  [
    "02",
    "Book Your Time",
    "Choose a time window that fits your schedule.",
    CalendarDays,
  ],
  [
    "03",
    "Park With Ease",
    "Arrive prepared with your booking details.",
    ParkingCircle,
  ],
];
const emailOk = (v) => /.+@.+\..+/.test(v) || /^[A-Za-z0-9/-]{4,}$/.test(v);

function Logo({ dark = false }) {
  return (
    <Link className={"logo " + (dark ? "logo-dark" : "")} to="/">
      <span>
        <ParkingCircle size={20} />
      </span>
      ParkEase
    </Link>
  );
}
function Button({
  children,
  className = "",
  to,
  type = "button",
  onClick,
  variant = "primary",
}) {
  const cls = `button ${variant} ${className}`;
  return to ? (
    <Link className={cls} to={to}>
      {children}
    </Link>
  ) : (
    <button className={cls} type={type} onClick={onClick}>
      {children}
    </button>
  );
}
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Home", "/"],
    ["How It Works", "/#how-it-works"],
    ["Features", "/#features"],
  ];
  return (
    <header className="nav-wrap">
      <nav className="nav">
        <Logo />
        <div className="nav-links">
          {links.map(([n, p]) => (
            <a href={p} key={n}>
              {n}
            </a>
          ))}
          <NavLink to="/guest-parking">Guest Parking</NavLink>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="login-link">
            Login
          </Link>
          <Button to="/register" className="nav-register">
            Register <ArrowRight size={15} />
          </Button>
        </div>
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {links.map(([n, p]) => (
              <a href={p} onClick={() => setOpen(false)} key={n}>
                {n}
              </a>
            ))}
            <Link to="/guest-parking" onClick={() => setOpen(false)}>
              Guest Parking
            </Link>
            <Link to="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Button to="/register" onClick={() => setOpen(false)}>
              Register
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <Logo dark />
          <p>Smart Parking for a Smarter Campus</p>
          <div className="socials">
            <span>in</span>
            <span>f</span>
            <span>◎</span>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#features">Features</a>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <div>
          <h4>Campus Parking</h4>
          <span>Car Parking</span>
          <span>Bike Parking</span>
          <span>Event Parking</span>
        </div>
        <div className="footer-note">
          <Sparkles size={19} />
          <p>Built around the everyday rhythm of college campuses.</p>
        </div>
      </div>
      <div className="copyright">© 2026 ParkEase. All rights reserved.</div>
    </footer>
  );
}
function Page({ children }) {
  const loc = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
function FeatureCard({ item }) {
  const [t, d, Icon] = item;
  return (
    <motion.article className="feature-card" whileHover={{ y: -5 }}>
      <span className="icon-box">
        <Icon size={22} />
      </span>
      <h3>{t}</h3>
      <p>{d}</p>
      <ArrowRight size={17} className="soft-arrow" />
    </motion.article>
  );
}
function Home() {
  return (
    <Page>
      <section className="hero">
        <div className="hero-copy">
          <motion.div
            className="eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Campus parking, made simple
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            Smart Parking for a <em>Smarter Campus</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            Find, book and manage your campus parking with ParkEase.
          </motion.p>
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <Button to="/login">
              Find Parking <ArrowRight size={17} />
            </Button>
            <Button to="/#how-it-works" variant="secondary">
              How It Works
            </Button>
          </motion.div>
          <div className="trusted">
            <div className="avatar-stack">
              <i /> <i /> <i />
            </div>
            For students, faculty & campus visitors
          </div>
        </div>
        <motion.div
          className="campus-scene"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65 }}
        >
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85"
            alt="College campus building"
          />
          <div className="scene-shade" />
          <div className="scene-title">
            <span>ParkEase</span>
            <strong>Your campus, in motion.</strong>
          </div>
          <div className="parking-lot">
            <div>🚗</div>
            <div>🛵</div>
            <div>🚙</div>
            <div>🏍️</div>
          </div>
          <motion.div
            className="float-card booking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <span className="green-dot" /> Campus Parking
            <br />
            <b>Easy booking</b>
          </motion.div>
          <motion.div
            className="float-card qr"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <ShieldCheck /> QR Entry
            <br />
            <b>Ready when you are</b>
          </motion.div>
        </motion.div>
      </section>
      <section id="how-it-works" className="section steps-section">
        <div className="section-heading centered">
          <span className="eyebrow">How it works</span>
          <h2>
            Parking that keeps pace
            <br />
            with campus life.
          </h2>
          <p>Three simple steps, with your day in mind.</p>
        </div>
        <div className="steps">
          {steps.map(([n, t, d, I]) => (
            <motion.article
              className="step"
              key={n}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
            >
              <span className="step-no">{n}</span>
              <div className="step-icon">
                <I />
              </div>
              <h3>{t}</h3>
              <p>{d}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section id="features" className="section feature-section">
        <div className="section-heading">
          <span className="eyebrow">Everything you need</span>
          <h2>
            A calmer way to
            <br />
            <em>arrive on campus.</em>
          </h2>
        </div>
        <div className="feature-grid">
          {featureData.map((x) => (
            <FeatureCard key={x[0]} item={x} />
          ))}
        </div>
      </section>
      <section className="section ride-section">
        <div className="section-heading centered">
          <span className="eyebrow">Made for every ride</span>
          <h2>
            Parking Designed for
            <br />
            <em>Every Campus Ride</em>
          </h2>
        </div>
        <div className="ride-grid">
          <ParkingCard type="car" />
          <ParkingCard type="bike" />
        </div>
      </section>
      <section className="why section">
        <div className="why-title">
          <span className="eyebrow">Why ParkEase</span>
          <h2>
            Built for the way
            <br />
            your campus parks.
          </h2>
          <p>
            Thoughtful tools for the people and places that make your campus
            move.
          </p>
        </div>
        <div className="why-list">
          {[
            [
              "Campus Focused",
              "Designed specifically for student and faculty parking.",
            ],
            ["Simple Booking", "Reserve parking without complicated hardware."],
            [
              "Time-Based Parking",
              "Manage parking according to selected time slots.",
            ],
            [
              "Centralized Management",
              "Help administrators manage slots and bookings.",
            ],
          ].map(([a, b], i) => (
            <div key={a}>
              <span>0{i + 1}</span>
              <article>
                <h3>{a}</h3>
                <p>{b}</p>
              </article>
            </div>
          ))}
        </div>
      </section>
      <section className="event-strip section">
        <div>
          <span className="event-pill">
            <CalendarDays size={14} /> Event-based guest access
          </span>
          <h2>College Event Parking</h2>
          <p>
            When a campus event is active, guest parking can be enabled for
            visitors.
          </p>
        </div>
        <div className="event-card">
          <small>UPCOMING EVENT</small>
          <b>Annual Fest 2026</b>
          <span>
            <i className="green-dot" /> Guest Parking Available
          </span>
          <Button to="/guest-parking" variant="secondary">
            View Event Parking <ArrowRight size={15} />
          </Button>
        </div>
      </section>
      <section className="final-cta">
        <div>
          <span className="eyebrow">Find. Book. Park. Done.</span>
          <h2>Ready to park smarter?</h2>
          <p>Make campus parking simple with ParkEase.</p>
          <Button to="/register">
            Get Started <ArrowRight size={17} />
          </Button>
        </div>
      </section>
    </Page>
  );
}
function ParkingCard({ type }) {
  const car = type === "car";
  const slots = car ? ["C01", "C02", "C03"] : ["B01", "B02", "B03", "B04"];
  return (
    <motion.article className={"ride-card " + type} whileHover={{ y: -5 }}>
      <div className="ride-card-head">
        <span>
          {car ? <Car /> : <Bike />} {car ? "Car Zone" : "Bike Zone"}
        </span>
        <small>
          {car ? "Wider marked spaces" : "Compact, convenient bays"}
        </small>
      </div>
      <div className="vehicle-art">{car ? "🚗" : "🏍️"}</div>
      <div className="slot-row">
        {slots.map((x) => (
          <span key={x}>
            {x}
            <i className="green-dot" />
          </span>
        ))}
      </div>
      <h3>{car ? "Car Parking" : "Bike Parking"}</h3>
      <p>
        {car
          ? "Comfortable room for four-wheelers near key campus buildings."
          : "Dense, accessible spots designed for two-wheelers."}
      </p>
    </motion.article>
  );
}
function Field({
  label,
  type = "text",
  value,
  setValue,
  placeholder,
  error,
  required = true,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      {error && (
        <small className="error">
          <CircleAlert size={13} />
          {error}
        </small>
      )}
    </label>
  );
}
function PasswordField({ label, value, setValue, error }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span>
        {label} <b>*</b>
      </span>
      <div className="password-wrap">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your password"
        />
        <button type="button" onClick={() => setShow(!show)}>
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && (
        <small className="error">
          <CircleAlert size={13} />
          {error}
        </small>
      )}
    </label>
  );
}
function Login() {
  const [id, setId] = useState(""),
    [pass, setPass] = useState(""),
    [submitted, setSubmitted] = useState(false),
    [loading, setLoading] = useState(false);
  const idError =
    submitted && !id
      ? "Please enter your college ID."
      : submitted && !emailOk(id)
        ? "Enter a valid college ID or email."
        : "";
  const passError = submitted && !pass ? "Please enter your password." : "";
  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (id && pass && emailOk(id)) {
      setLoading(true);
      setTimeout(() => setLoading(false), 900);
    }
  }
  return (
    <Page>
      <section className="auth-page">
        <div className="auth-visual login-visual">
          <div>
            <Logo dark />
            <span className="visual-kicker">CAMPUS PARKING</span>
            <h2>
              Arrive easy.
              <br />
              Park with confidence.
            </h2>
            <p>One campus, one calmer parking experience.</p>
          </div>
        </div>
        <motion.form
          className="auth-card"
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in to ParkEase</h1>
          <p className="form-intro">Manage your campus parking in one place.</p>
          <Field
            label="College ID / Email"
            value={id}
            setValue={setId}
            placeholder="e.g. CS2024001 or you@college.edu"
            error={idError}
          />
          <PasswordField
            label="Password"
            value={pass}
            setValue={setPass}
            error={passError}
          />
          <div className="form-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#forgot">Forgot password?</a>
          </div>
          <Button type="submit" className="form-button">
            {loading ? (
              "Signing in…"
            ) : (
              <>
                Login <ArrowRight size={17} />
              </>
            )}
          </Button>
          {loading && (
            <div className="success-note">
              <Check size={16} /> Ready for future authentication.
            </div>
          )}
          <p className="switch-auth">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </motion.form>
      </section>
    </Page>
  );
}
function Register() {
  const [form, setForm] = useState({
    name: "",
    user: "Student",
    college: "",
    email: "",
    phone: "",
    vehicle: "",
    vehicleType: "Bike",
    password: "",
    confirm: "",
  });
  const [sent, setSent] = useState(false);
  const update = (k) => (v) => setForm({ ...form, [k]: v });
  const score =
    form.password.length > 9
      ? 3
      : form.password.length > 5
        ? 2
        : form.password
          ? 1
          : 0;
  function submit(e) {
    e.preventDefault();
    setSent(true);
  }
  return (
    <Page>
      <section className="register-page">
        <div className="register-heading">
          <span className="eyebrow">Join ParkEase</span>
          <h1>Create your ParkEase Account</h1>
          <p>Register with your college details to manage parking.</p>
        </div>
        <form className="register-card" onSubmit={submit}>
          <FormSection title="Personal Details">
            <Field
              label="Full Name"
              value={form.name}
              setValue={update("name")}
              placeholder="Your full name"
            />
            <label className="field">
              <span>
                User Type <b>*</b>
              </span>
              <div className="choice-row">
                {["Student", "Faculty"].map((x) => (
                  <button
                    type="button"
                    className={form.user === x ? "selected" : ""}
                    onClick={() => update("user")(x)}
                    key={x}
                  >
                    <UserRound size={15} />
                    {x}
                  </button>
                ))}
              </div>
            </label>
          </FormSection>
          <FormSection title="College Details">
            <Field
              label="College ID / Enrollment Number"
              value={form.college}
              setValue={update("college")}
              placeholder="e.g. CS2024001"
            />
            <Field
              label="College Email"
              value={form.email}
              setValue={update("email")}
              placeholder="you@college.edu"
              type="email"
            />
            <Field
              label="Phone Number"
              value={form.phone}
              setValue={update("phone")}
              placeholder="10-digit mobile number"
              type="tel"
            />
          </FormSection>
          <FormSection title="Vehicle Details">
            <Field
              label="Vehicle Number"
              value={form.vehicle}
              setValue={update("vehicle")}
              placeholder="e.g. MH 12 AB 1234"
            />
            <label className="field">
              <span>
                Vehicle Type <b>*</b>
              </span>
              <div className="vehicle-select">
                {[
                  ["Car", Car],
                  ["Bike", Bike],
                ].map(([x, I]) => (
                  <button
                    type="button"
                    className={form.vehicleType === x ? "selected" : ""}
                    onClick={() => update("vehicleType")(x)}
                    key={x}
                  >
                    <I size={20} />
                    <span>{x}</span>
                  </button>
                ))}
              </div>
            </label>
          </FormSection>
          <FormSection title="Account Security">
            <PasswordField
              label="Password"
              value={form.password}
              setValue={update("password")}
            />
            <div className="strength">
              <span>Password strength</span>
              <div>
                {[1, 2, 3].map((x) => (
                  <i key={x} className={x <= score ? "on" : ""} />
                ))}
              </div>
            </div>
            <PasswordField
              label="Confirm Password"
              value={form.confirm}
              setValue={update("confirm")}
              error={
                form.confirm && form.password !== form.confirm
                  ? "Passwords do not match."
                  : ""
              }
            />
          </FormSection>
          {sent && (
            <div className="success-note">
              <Check size={16} /> Registration details are ready for backend
              integration.
            </div>
          )}
          <Button type="submit" className="form-button">
            Create Account <ArrowRight size={17} />
          </Button>
          <p className="switch-auth">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </Page>
  );
}
function FormSection({ title, children }) {
  return (
    <section className="form-section">
      <h3>{title}</h3>
      <div className="form-grid">{children}</div>
    </section>
  );
}
function GuestParking() {
  const [active, setActive] = useState(false);
  const [type, setType] = useState("Car");
  return (
    <Page>
      <section className="guest-page">
        <div className="guest-banner">
          <span className="eyebrow">Event access only</span>
          <h1>Guest Parking</h1>
          <p>
            Guest parking is opened by the college only for approved campus
            events.
          </p>
        </div>
        <div className="demo-switch">
          <span>Preview state</span>
          <button
            onClick={() => setActive(!active)}
            className={active ? "on" : ""}
          >
            <i />
          </button>
          <b>{active ? "Active event" : "No active event"}</b>
        </div>
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              className="empty-event"
              key="off"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="empty-icon">
                <CalendarDays />
              </div>
              <span className="eyebrow">No event right now</span>
              <h2>Guest Parking Isn't Active</h2>
              <p>
                Guest parking becomes available when a college event is enabled.
              </p>
              <Link to="/" className="text-link">
                Return to Home <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <motion.form
              className="guest-form"
              key="on"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="event-active-head">
                <div>
                  <span className="green-dot" /> Guest Parking is Open
                </div>
                <h2>Annual Fest 2026</h2>
                <p>12–14 April · Main Campus</p>
              </div>
              <div className="form-grid">
                <Field
                  label="Guest Name"
                  value=""
                  setValue={() => {}}
                  placeholder="Full name"
                />
                <Field
                  label="Mobile Number"
                  value=""
                  setValue={() => {}}
                  placeholder="10-digit mobile number"
                />
                <Field
                  label="Vehicle Number"
                  value=""
                  setValue={() => {}}
                  placeholder="e.g. MH 12 AB 1234"
                />
                <label className="field">
                  <span>
                    Vehicle Type <b>*</b>
                  </span>
                  <div className="choice-row">
                    {["Car", "Bike"].map((x) => (
                      <button
                        type="button"
                        key={x}
                        className={type === x ? "selected" : ""}
                        onClick={() => setType(x)}
                      >
                        {x === "Car" ? <Car size={15} /> : <Bike size={15} />}{" "}
                        {x}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <Button>
                Continue to Guest Booking <ArrowRight size={17} />
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </Page>
  );
}
function Protected({ children, admin = false }) {
  const user = useAuthenticatedUser();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return children;
}
function App() {
  const routes = {
    "/": <Home />,
    "/login": <NewLogin />,
    "/register": <NewRegisterV2 />,
    "/guest-parking": <NewGuest />,
    "/dashboard": (
      <Protected>
        <Dashboard />
      </Protected>
    ),
    "/admin/dashboard": (
      <Protected admin>
        <AdminDashboard />
      </Protected>
    ),
    "/admin/slots": (
      <Protected admin>
        <SlotsPage />
      </Protected>
    ),
    "/admin/bookings": (
      <Protected admin>
        <BookingsPage />
      </Protected>
    ),
    "/admin/users": (
      <Protected admin>
        <UsersPage />
      </Protected>
    ),
    "/admin/reports": (
      <Protected admin>
        <ReportsPage />
      </Protected>
    ),
    "/admin/violations": (
      <Protected admin>
        <ViolationsPage />
      </Protected>
    ),
    "/admin/events": (
      <Protected admin>
        <EventsPage />
      </Protected>
    ),
    "/admin/gate-qr": (
  <Protected admin>
    <GateQRPage />
  </Protected>
),
    "/admin/notifications": (
      <Protected admin>
        <AdminNotifications />
      </Protected>
    ),
    "/parking": (
      <Protected>
        <ParkingPage />
      </Protected>
    ),
    "/find-parking": (
      <Protected>
        <ParkingPage />
      </Protected>
    ),
    "/parking/car": (
      <Protected>
        <ParkingPage initialType="Car" />
      </Protected>
    ),
    "/parking/bike": (
      <Protected>
        <ParkingPage initialType="Bike" />
      </Protected>
    ),
    "/booking": (
      <Protected>
        <BookingPage />
      </Protected>
    ),
    "/booking/confirmation": (
      <Protected>
        <ConfirmationPage />
      </Protected>
    ),
   "/entry-qr": (
  <Protected>
    <EntryVerification />
  </Protected>
),
    
    "/entry-verification": (
      <Protected>
        <EntryVerification />
      </Protected>
    ),
    "/active-parking": (
      <Protected>
        <ActiveParkingPage />
      </Protected>
    ),
    "/my-bookings": (
      <Protected>
        <MyBookings />
      </Protected>
    ),
    "/booking-history": (
      <Protected>
        <HistoryPage />
      </Protected>
    ),
    "/profile": (
      <Protected>
        <ProfilePage />
      </Protected>
    ),
    "/notifications": (
      <Protected>
        <NotificationsPage />
      </Protected>
    ),
    "/parking-status": (
      <Protected>
        <ParkingStatus />
      </Protected>
    ),
  };
  const path = useLocation().pathname;
  if (path.startsWith("/assigned-slot/"))
    return (
      <Protected>
        <AssignedSlotPage />
      </Protected>
    );
  if (path.startsWith("/admin/bookings/"))
    return (
      <Protected admin>
        <AdminBookingDetails />
      </Protected>
    );
  if (path.startsWith("/admin/parking-slots/edit/"))
    return (
      <Protected admin>
        <EditSlotPage />
      </Protected>
    );
  if (path.startsWith("/admin/users/"))
    return (
      <Protected admin>
        <UserDetails />
      </Protected>
    );
  return path.startsWith("/booking/") && !routes[path] ? (
    <Protected>
      <BookingDetails />
    </Protected>
  ) : (
    routes[path] || <Home />
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

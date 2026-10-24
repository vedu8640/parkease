import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Car,
  Check,
  Eye,
  EyeOff,
  Mail,
  ParkingCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { loginMockUser, registerUserWithIdentity } from "../services/authService";

function AuthVisual() {
  return (
    <motion.aside
      className="auth-side"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Link to="/" className="logo logo-dark">
        <span>
          <ParkingCircle size={20} />
        </span>
        ParkEase
      </Link>

      <div className="auth-side-copy">
        <span className="eyebrow">Campus parking management</span>

        <h2>
          Smart Parking for
          <br />
          Your Campus
        </h2>

        <p>
          Reserve your parking slot, manage your booking, and arrive on campus
          with ease.
        </p>

        <div className="auth-mini-slots">
          <span>
            <Car size={18} />
            <b>C12</b>
            <i>Available</i>
          </span>

          <span>
            <Bike size={18} />
            <b>B08</b>
            <i>Available</i>
          </span>

          <span>
            <ParkingCircle size={18} />
            <b>Zone A</b>
            <i>Academic Block</i>
          </span>
        </div>
      </div>

      <div className="auth-parking-lines">
        <i />
        <i />
        <i />
        <i />
      </div>
    </motion.aside>
  );
}

function Password({ value, setValue, label = "Password", placeholder = "Enter your password" }) {
  const [show, setShow] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>

      <div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />

        <button type="button" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function Input({ label, value, setValue, placeholder, type = "text" }) {
  return (
    <label className="auth-field">
      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function NewLogin() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!pass) {
      setError("Please enter your password.");
      return;
    }

    if (!/.+@.+\..+/.test(email)) {
      setError("Invalid email or password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await loginMockUser(email, pass);

      if (!user) {
        setError("Invalid email or password.");
        return;
      }

      if (user.role === "admin") {
        nav("/admin/dashboard", { replace: true });
      } else {
        nav("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-redesign">
      <AuthVisual />

      <motion.form
        className="auth-form-new"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
      >
        <span className="eyebrow">ParkEase account</span>

        <h1>Welcome Back</h1>

        <p>Access your ParkEase campus parking account.</p>

        <div className="auth-form-fields">
          <Input
            label="Email"
            value={email}
            setValue={setEmail}
            placeholder="Enter your college or admin email"
            type="email"
          />

          <Password value={pass} setValue={setPass} />
        </div>

        <div className="auth-options">
          <label>
            <input type="checkbox" />
            Remember me
          </label>

          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="auth-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? (
            "Signing in…"
          ) : (
            <>
              Login <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <small className="admin-note">
          <ShieldCheck size={14} />
          Admin accounts are managed by the college authority.
        </small>
      </motion.form>
    </section>
  );
}

export function NewRegister() {
  const nav = useNavigate();

  const [role, setRole] = useState("student");

  const [form, setForm] = useState({
    name: "",
    email: "",
    id: "",
    mobile: "",
    vehicle: "",
    vehicleType: "Bike",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [identityDocument, setIdentityDocument] = useState(null);
  const [identityType, setIdentityType] = useState("aadhaar");
  const [identityNumber, setIdentityNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  async function submit(e) {
    e.preventDefault();

    if (Object.values(form).some((v) => !v) || !identityNumber || !identityDocument) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError(""); setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("password", form.password);
      payload.append("role", role);
      payload.append(role === "student" ? "collegeId" : "facultyId", form.id);
      payload.append("mobile", form.mobile);
      payload.append("vehicleNumber", form.vehicle);
      payload.append("vehicleType", form.vehicleType.toLowerCase());
      payload.append("identityType", identityType);
      payload.append("identityNumber", identityNumber);
      payload.append("identityDocument", identityDocument);
      await registerUserWithIdentity(payload);
      nav("/dashboard");
    } catch (registrationError) {
      setError(registrationError.message);
    } finally { setLoading(false); }
  }

  const idLabel =
    role === "student"
      ? "Enrollment Number / Computer Code"
      : "Faculty / Employee ID";

  return (
    <section className="auth-redesign register-redesign">
      <AuthVisual />

      <motion.form
        className="auth-form-new register-form-new"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
      >
        <span className="eyebrow">Join ParkEase</span>

        <h1>Create Your ParkEase Account</h1>

        <p>Register to reserve and manage your campus parking.</p>

        <div className="role-picker">
          {[
            ["student", "Student"],
            ["faculty", "Faculty"],
          ].map(([value, label]) => (
            <button
              type="button"
              className={role === value ? "active" : ""}
              onClick={() => setRole(value)}
              key={value}
            >
              <UserRound size={16} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="register-fields"
          >
            <h3>
              {role === "student"
                ? "Student Registration"
                : "Faculty Registration"}
            </h3>

            <div className="auth-grid">
              <Input
                label="Full Name"
                value={form.name}
                setValue={update("name")}
                placeholder="Enter your full name"
              />

              <label className="auth-field">
                <span>Identity Type</span>
                <select value={identityType} onChange={(e) => setIdentityType(e.target.value)}>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="vehicle_registration">Vehicle Registration ID</option>
                </select>
              </label>

              <Input
                label={identityType === "aadhaar" ? "Aadhaar Number" : "Vehicle Registration ID"}
                value={identityNumber}
                setValue={setIdentityNumber}
                placeholder={identityType === "aadhaar" ? "12-digit Aadhaar number" : "Enter registration ID"}
              />

              <label className="auth-field">
                <span>{identityType === "aadhaar" ? "Upload Aadhaar photo with your name visible" : "Upload a clear vehicle registration image"} (JPG or PNG; max 5 MB)</span>
                <input type="file" accept="image/jpeg,image/png" onChange={(e) => setIdentityDocument(e.target.files?.[0] || null)} required />
              </label>

              <Input
                label="College Email"
                value={form.email}
                setValue={update("email")}
                placeholder="Enter your college email"
                type="email"
              />

              <Input
                label={idLabel}
                value={form.id}
                setValue={update("id")}
                placeholder={
                  role === "student"
                    ? "Enter your enrollment number"
                    : "Enter your faculty ID"
                }
              />

              <Input
                label="Mobile Number"
                value={form.mobile}
                setValue={update("mobile")}
                placeholder="Enter your mobile number"
                type="tel"
              />

              <Input
                label="Vehicle Number"
                value={form.vehicle}
                setValue={update("vehicle")}
                placeholder="Enter vehicle number"
              />

              <label className="auth-field">
                <span>Vehicle Type</span>

                <div className="auth-vehicle-picker">
                  {[
                    ["Car", Car],
                    ["Bike", Bike],
                  ].map(([type, Icon]) => (
                    <button
                      key={type}
                      type="button"
                      className={form.vehicleType === type ? "active" : ""}
                      onClick={() => update("vehicleType")(type)}
                    >
                      <Icon size={17} />
                      {type}
                    </button>
                  ))}
                </div>
              </label>

              <Password
                value={form.password}
                setValue={update("password")}
                label="Enter Password"
                placeholder="Enter your password"
              />

              <Password
                value={form.confirm}
                setValue={update("confirm")}
                label="Confirm Password"
                placeholder="Confirm your password"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              className="auth-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Creating account…" : <>Create Account <ArrowRight size={17} /></>}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <small className="admin-note">
          <ShieldCheck size={14} />
          Admin accounts are created and managed by the college authority.
        </small>
      </motion.form>
    </section>
  );
}

export function NewGuest() {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="guest-new">
      <div>
        <span className="eyebrow">Event parking only</span>

        <h1>Guest Parking</h1>

        <p>
          Guest parking is available only when an approved college event is
          active.
        </p>

        <button className="event-toggle" onClick={() => setActive(!active)}>
          {active ? "Preview active event" : "Preview no active event"}
        </button>
      </div>

      {!active ? (
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="guest-unavailable"
        >
          <ParkingCircle size={30} />

          <h2>Guest Parking is currently unavailable</h2>

          <p>Guest parking will appear here when a college event is active.</p>
        </motion.article>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
          className="guest-active"
        >
          <span className="guest-live">Event Parking Available</span>

          <h2>Annual Fest 2026</h2>

          <p>12–14 April · Main Campus</p>

          <div className="auth-grid">
            <Input
              label="Guest Name"
              value=""
              setValue={() => {}}
              placeholder="Enter your full name"
            />

            <Input
              label="Email"
              value=""
              setValue={() => {}}
              placeholder="Enter your email"
              type="email"
            />

            <Input
              label="Mobile Number"
              value=""
              setValue={() => {}}
              placeholder="Enter your mobile number"
            />

            <Input
              label="Vehicle Number"
              value=""
              setValue={() => {}}
              placeholder="Enter vehicle number"
            />
          </div>

          <div className="auth-vehicle-picker">
            <button type="button" className="active">
              <Car size={17} />
              Car
            </button>

            <button type="button">
              <Bike size={17} />
              Bike
            </button>
          </div>

          {done && (
            <p className="guest-id">
              <Check size={15} />
              Guest Booking ID: GP-2026-0138
            </p>
          )}

          <button className="auth-submit">
            Continue to Guest Booking
            <ArrowRight size={17} />
          </button>
        </motion.form>
      )}
    </section>
  );
}

export function NewRegisterV2() {
  const nav = useNavigate();

  const [role, setRole] = useState("student");

  const [form, setForm] = useState({
    name: "",
    email: "",
    collegeId: "",
    mobile: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");

  const update = (key) => (value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const label =
    role === "student"
      ? "Enrollment Number / Computer Code"
      : "Faculty / Employee ID";

  async function submit(e) {
    e.preventDefault();

    if (Object.values(form).some((v) => !v)) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");

      await registerMockUser({
        name: form.name,
        email: form.email,
        collegeId: form.collegeId,
        mobile: form.mobile,
        password: form.password,
        role,
      });

      nav("/login");
    } catch (err) {
      setError(err?.message || "Registration failed. Please try again.");
    }
  }

  return (
    <section className="auth-redesign register-redesign">
      <AuthVisual />

      <motion.form
        className="auth-form-new register-form-new"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
      >
        <span className="eyebrow">Join ParkEase</span>

        <h1>Create Your ParkEase Account</h1>

        <p>Register to reserve and manage your campus parking.</p>

        <div className="role-picker">
          {[
            ["student", "Student"],
            ["faculty", "Faculty"],
          ].map(([value, text]) => (
            <button
              type="button"
              key={value}
              className={role === value ? "active" : ""}
              onClick={() => setRole(value)}
            >
              <UserRound size={16} />
              {text}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            className="register-fields"
            key={role}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <h3>
              {role === "student"
                ? "Student Registration"
                : "Faculty Registration"}
            </h3>

            <div className="auth-grid">
              <Input
                label="Full Name"
                value={form.name}
                setValue={update("name")}
                placeholder="Enter your full name"
              />

              <Input
                label="College Email"
                value={form.email}
                setValue={update("email")}
                placeholder="Enter your college email"
                type="email"
              />

              <Input
                label={label}
                value={form.collegeId}
                setValue={update("collegeId")}
                placeholder={
                  role === "student"
                    ? "Enter your enrollment number"
                    : "Enter your faculty ID"
                }
              />

              <Input
                label="Mobile Number"
                value={form.mobile}
                setValue={update("mobile")}
                placeholder="Enter your mobile number"
                type="tel"
              />

              <Password value={form.password} setValue={update("password")} />

              <label className="auth-field">
                <span>Confirm Password</span>

                <div>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => update("confirm")(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </div>
              </label>
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            className="auth-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <button className="auth-submit" type="submit">
          Create Account <ArrowRight size={17} />
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <small className="admin-note">
          <ShieldCheck size={14} />
          Admin accounts are created and managed by the college authority.
        </small>
      </motion.form>
    </section>
  );
}

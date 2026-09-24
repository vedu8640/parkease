import { AlertCircle, X } from "lucide-react";

export function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="feedback-loading" role="status">
      <i />
      {label}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="feedback-empty">
      {Icon && <Icon size={28} />}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorMessage({ children }) {
  return (
    <p className="feedback-error">
      <AlertCircle size={16} />
      {children}
    </p>
  );
}

export function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
      <button onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

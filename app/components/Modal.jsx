"use client";
export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 999, background: "rgba(12,18,30,0.45)" 
      }} onClick={onClose} />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        zIndex: 1000, width: "min(720px,94%)"
      }}>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{fontWeight:700}}>{title}</div>
            <button className="btn ghost" onClick={onClose}>Close</button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </>
  );
}

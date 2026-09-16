export default function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div
        className="aurora-blob"
        style={{ width: 500, height: 500, background: "#7c3aed", top: "-10%", left: "-10%" }}
      />
      <div
        className="aurora-blob"
        style={{ width: 450, height: 450, background: "#06b6d4", top: "20%", right: "-8%" }}
      />
      <div
        className="aurora-blob"
        style={{ width: 400, height: 400, background: "#ec4899", bottom: "-10%", left: "30%" }}
      />
    </div>
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone para a tela inicial do iPhone: símbolo da marca sobre o papel. */
export default function IconeApple() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F6F1" }}>
        <svg width="140" height="140" viewBox="0 0 100 100">
          <circle cx="46" cy="54" r="38" fill="#1F3FD1" />
          <rect x="40" y="30" width="12" height="32" rx="6" fill="#FFFFFF" />
          <circle cx="46" cy="75" r="6.5" fill="#FFFFFF" />
          <circle cx="80" cy="20" r="15" fill="#FFE14D" stroke="#F5F6F1" strokeWidth="6" />
        </svg>
      </div>
    ),
    size,
  );
}

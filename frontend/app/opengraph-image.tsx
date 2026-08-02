import { ImageResponse } from "next/og";

export const alt = "LA Group (LAHR)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og (satori) không kèm sẵn font có dấu tiếng Việt — dùng chữ không dấu
// trong ảnh để tránh glyph vỡ/tofu khi không nhúng font riêng.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a3d7a 0%, #1471d9 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>LA GROUP</div>
        <div style={{ marginTop: 16, fontSize: 32, fontWeight: 600, color: "#e8f2fd" }}>
          Cung ung nhan luc &amp; Ket noi viec lam tai Hai Duong
        </div>
      </div>
    ),
    { ...size },
  );
}

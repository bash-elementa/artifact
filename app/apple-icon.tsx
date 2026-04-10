import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#040404",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            color: "#FCFCFC",
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontFamily: "sans-serif",
            marginTop: 4,
          }}
        >
          /a
        </span>
      </div>
    ),
    { ...size }
  );
}

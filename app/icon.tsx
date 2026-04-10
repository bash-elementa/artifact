import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/**
 * Generates the site favicon as a PNG so it works in all browsers,
 * including Safari which does not support SVG favicons.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 48,
          height: 48,
          background: "#040404",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
        }}
      >
        {/* "/a" logotype — matches the SVG favicon mark */}
        <span
          style={{
            color: "#FCFCFC",
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontFamily: "sans-serif",
            marginTop: 1,
          }}
        >
          /a
        </span>
      </div>
    ),
    { ...size }
  );
}

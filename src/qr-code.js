import QRCode from "qrcode";

globalThis.ElevsporQr = {
  async toDataUrl(value) {
    return QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#33206f", light: "#ffffff" }
    });
  }
};

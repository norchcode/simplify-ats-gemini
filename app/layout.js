import "./globals.css";

export const metadata = {
  title: "ATS Resume Scanner + Gemini Chatbot",
  description: "Final Project - CV/Resume ATS Scanner dengan Gemini API"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Inventory App",
  description: "Lightweight inventory & sales tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
  
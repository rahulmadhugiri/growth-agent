import { Geist, Geist_Mono, Varela } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SourcesProvider } from "../contexts/SourcesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const varela = Varela({
  weight: ["400"],
  variable: "--font-varela",
  subsets: ["latin"],
});

export const metadata = {
  title: "Growth - AI-Powered Business Assistant",
  description: "Your AI assistant for business growth and data insights",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${varela.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <SourcesProvider>
              {children}
            </SourcesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

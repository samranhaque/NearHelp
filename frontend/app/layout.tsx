import SOSButton from "@/components/dashboard/sos-button";
import { AuthProvider } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F8F8FA] font-sans antialiased">
        {children}
        <SOSButton />
      </div>
    </AuthProvider>
  );
}

import SOSButton from "@/components/dashboard/sos-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F8FA] font-sans antialiased">
      {children}
      <SOSButton />
    </div>
  );
}

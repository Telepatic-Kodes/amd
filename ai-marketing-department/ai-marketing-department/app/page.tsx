import { redirect } from "next/navigation";

export default function RootPage() {
  // TODO: Implement auth check here
  // If user is authenticated, redirect to /dashboard
  // If not, redirect to /landing

  // For now, always redirect to landing
  redirect("/landing");
}

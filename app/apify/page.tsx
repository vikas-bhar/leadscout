import { ApifyConsole } from "@/components/apify/ApifyConsole";

export const metadata = {
  title: "Apify Run Console — Actor Run Inspector",
  description: "Monitor, inspect datasets, view logs, and test API endpoints for Apify Actor Runs.",
};

export default function ApifyPage() {
  return <ApifyConsole />;
}

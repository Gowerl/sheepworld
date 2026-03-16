import JobDetailClient from "./JobDetailClient";

export const dynamic = "force-static";
export const dynamicParams = true; 

export function generateStaticParams() {
  return [{ id: "index" }];
}

export default function Page() {
  return <JobDetailClient />;
}

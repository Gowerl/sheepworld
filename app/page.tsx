'use client';

import { CreateJobModal } from "@/components/create-job-modal";
import { db } from "../src/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Korrigierte Query: orderBy hinzugefügt, damit die Liste sortiert bleibt
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id, // doc.id ist immer ein String
        ...doc.data()
      }));
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="p-10 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold italic tracking-tighter uppercase">Sheepworld Video AI</h1>
        <div className="flex gap-4 items-center">
             <Badge variant="outline" className="font-mono">{jobs.length} Nodes</Badge>
             <CreateJobModal />
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="text-[10px] uppercase font-black">Job ID</TableHead>
              <TableHead className="text-[10px] uppercase font-black">Status</TableHead>
              <TableHead className="text-[10px] uppercase font-black">Brand</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-black">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-400 italic">Establishing Link...</TableCell></TableRow>
            ) : jobs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-zinc-400 italic">No active nodes found.</TableCell></TableRow>
            ) : jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-[10px] text-zinc-500">{job.id}</TableCell>
                <TableCell>
                  <Badge className={
                    job.status === 'scene_generated' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                    job.status === 'generating_scene' ? 'bg-blue-500/10 text-blue-600 animate-pulse border-blue-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  } variant="outline">
                    {job.status || 'Initialisiert'}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-zinc-700">{job.brand || '-'}</TableCell>
                <TableCell className="text-right">
                  {/* FIX: String Konvertierung um den Runtime Error zu vermeiden */}
                  <Link 
                    href={`/job/${encodeURIComponent(String(job.id))}`} 
                    className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-tighter text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Open Link [→]
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
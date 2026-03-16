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
    // Query: Hole Jobs, sortiert nach Erstellungsdatum (neueste oben)
    const q = query(collection(db, "jobs"));

    // onSnapshot ist die "Magie" für Echtzeit-Updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsData);
      setLoading(false);
    });

    return () => unsubscribe(); // Verbindung trennen, wenn Seite verlassen wird
  }, []);

  return (
    <main className="p-10 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sheepworld Video AI</h1>
        <div className="flex gap-4 items-center">
             <Badge variant="outline">{jobs.length} Jobs</Badge>
             <CreateJobModal />
        </div>
      </div>

      <div className="border rounded-lg p-2 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Lädt...</TableCell></TableRow>
            ) : jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium text-slate-500">{job.id}</TableCell>
                <TableCell>
                  <Badge className={
                    job.status === 'scene_generated' ? 'bg-green-500' : 
                    job.status === 'generating_scene' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                  }>
                    {job.status || 'Initialisiert'}
                  </Badge>
                </TableCell>
                <TableCell>{job.brand || '-'}</TableCell>
              <TableCell className="text-right">
                <Link href={`/job/${job.id}`} className="text-blue-600 hover:underline font-medium">
                  Details öffnen
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
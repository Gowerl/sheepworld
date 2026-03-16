'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sparkles, ZoomIn, Play, Image as ImageIcon,
  Film, Mic, RefreshCcw, Download, Box, MapPin, Ruler,
  ArrowLeft, Activity, Code2, FileText
} from "lucide-react";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [zoomImage, setZoomImage] = useState<{src: string, title: string} | null>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const steps = [
    { key: 'flow1_scene', label: '1. Scene', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-scene", color: "bg-blue-500", glow: "#3b82f6" },
    { key: 'flow2_startframe', label: '2. Startframe', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-startframe", color: "bg-cyan-500", glow: "#06b6d4" },
    { key: 'flow3_endframe', label: '3. Endframe', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-endframe", color: "bg-indigo-500", glow: "#6366f1" },
    { key: 'flow4_video_silent', label: '4. Video', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-video-silent", color: "bg-purple-500", glow: "#a855f7" },
    { key: 'flow5_voiceover', label: '5. Voiceover', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-voiceover", color: "bg-pink-500", glow: "#ec4899" },
    { key: 'flow6_muxing', label: '6. Final Video', webhook: "https://myc3.app.n8n.cloud/webhook-test/mux-video", color: "bg-green-500", glow: "#22c55e" }
  ];

  useEffect(() => {
    setIsClient(true);
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "jobs", id as string), (docSnap) => {
      if (docSnap.exists()) setJob(docSnap.data());
    });
    return () => unsubscribe();
  }, [id]);

  const activeStepKey = (() => {
    if (!job?.flowStatus) return null;
    for (const step of steps) {
      if (job.flowStatus[step.key] === 'waiting') return step.key;
    }
    return null;
  })();

  const triggerFlow = async (fKey: string, wUrl: string) => {
    setIsTriggering(fKey);
    try {
      await fetch(wUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });
    } catch (e) {
      console.error("Flow Error:", e);
    } finally { 
      setIsTriggering(null); 
    }
  };

  if (!job) return (
    <div className="p-20 text-center bg-black min-h-screen text-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" />
      <p className="text-xs uppercase tracking-widest opacity-50">Loading Node Data...</p>
    </div>
  );

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-black text-white">
      <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
        <div className="space-y-4">
          <Button onClick={() => router.push('/')} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-widest font-black">
            <ArrowLeft size={14} /> [ DISCONNECT ]
          </Button>
          <h1 className="text-7xl font-black italic tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">
            {job?.product_shop_title || "ALPHA_SEQUENCE"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-1 space-y-2">
           {steps.map((s) => (
              <Button key={s.key} onClick={() => triggerFlow(s.key, s.webhook)} disabled={activeStepKey !== s.key || !!isTriggering} className="w-full justify-between bg-zinc-900 text-[10px] font-black uppercase p-4 rounded-xl">
                {s.label} <Play size={14} />
              </Button>
           ))}
        </div>
        <div className="lg:col-span-5 italic text-zinc-500 text-sm">
           NODE_ID: {id} | SYSTEM_READY
        </div>
      </div>
    </main>
  );
}
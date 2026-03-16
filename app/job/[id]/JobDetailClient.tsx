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

export default function JobDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [zoomImage, setZoomImage] = useState<{src: string, title: string} | null>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const rawId = params?.id || (typeof window !== "undefined" ? window.location.pathname.split('/').pop() : "");
  const id = rawId ? decodeURIComponent(rawId as string) : "";

  const steps = [
    { key: "flow1_scene", label: "1. Scene", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-scene", color: "bg-blue-500", glow: "#3b82f6" },
    { key: "flow2_startframe", label: "2. Startframe", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-startframe", color: "bg-cyan-500", glow: "#06b6d4" },
    { key: "flow3_endframe", label: "3. Endframe", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-endframe", color: "bg-indigo-500", glow: "#6366f1" },
    { key: "flow4_video_silent", label: "4. Video", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-video-silent", color: "bg-purple-500", glow: "#a855f7" },
    { key: "flow5_voiceover", label: "5. Voiceover", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-voiceover", color: "bg-pink-500", glow: "#ec4899" },
    { key: "flow6_muxing", label: "6. Final Video", webhook: "https://myc3.app.n8n.cloud/webhook-test/mux-video", color: "bg-green-500", glow: "#22c55e" }
  ];

  useEffect(() => {
    setIsClient(true);
    if (!id || id === "index" || id === "") return;
    
    const unsubscribe = onSnapshot(doc(db, "jobs", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setJob(docSnapshot.data());
      }
    });
    return () => unsubscribe();
  }, [id]);

  const activeStepKey = (() => {
    if (!job?.flowStatus) return null;
    for (const step of steps) {
      if (job.flowStatus[step.key] === "waiting") return step.key;
    }
    return null;
  })();

  const triggerFlow = async (flowKey: string, webhookUrl: string) => {
    setIsTriggering(flowKey);
    try {
      await fetch(webhookUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });
    } catch (error) {
      console.error("Flow Trigger Error:", error);
    } finally { 
      setIsTriggering(null); 
    }
  };

  const AssetCard = ({ title, src, type, jobKey, icon: Icon, colorClass, glowColor }: any) => (
    <Card className={`relative group border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-zinc-400 shadow-2xl ${src ? "hover:shadow-lg" : ""}`}>
      {job?.flowStatus?.[jobKey] === "processing" && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className={`w-full h-[2px] ${colorClass} animate-scan opacity-70`} />
        </div>
      )}
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-black/20">
        <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
          {Icon && <Icon size={14} className="opacity-50" />} {title}
        </CardTitle>
        {src && <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`} />}
      </CardHeader>
      <CardContent className="p-0 relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {src ? (
          type === "video" ? (
            <video src={src} controls className="w-full h-full object-cover bg-black" />
          ) : (
            <div className="cursor-zoom-in w-full h-full group/img" onClick={() => setZoomImage({src, title})}>
              <img src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" alt={title} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="text-white w-6 h-6" />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            {job?.flowStatus?.[jobKey] === "processing" ? <Loader2 className="animate-spin text-blue-500 w-6 h-6" /> : <Activity className="w-6 h-6" />}
            <span className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Stream</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!job) return (
    <div className="p-20 text-center bg-black min-h-screen text-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" />
      <p className="text-xs uppercase tracking-widest opacity-50">Loading Node Data...</p>
    </div>
  );

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-black text-white selection:bg-blue-500/30">
      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>

      {zoomImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setZoomImage(null)}>
          <img src={zoomImage.src} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-white/5" alt="Zoom" />
        </div>
      )}

      <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
        <div className="space-y-4">
          <Button onClick={() => router.push("/")} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-[0.3em] font-black">
            <ArrowLeft size={14} /> [ DISCONNECT_FROM_FLEET ]
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-4 mb-2">
              <Badge className="bg-blue-500/5 text-blue-500 border-blue-500/20 font-mono px-3 uppercase tracking-tighter">NODE_ID: {id}</Badge>
              <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Stream_Active
              </div>
            </div>
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic">
              {job?.product_shop_title || "ALPHA_SEQUENCE"}
            </h1>
          </div>
        </div>
        {job?.video_url_with_sound_http && (
          <Button onClick={() => window.open(job.video_url_with_sound_http, "_blank")} className="bg-white text-black hover:bg-zinc-200 font-black h-16 px-12 rounded-2xl">
            <Download size={22} className="mr-3" /> DOWNLOAD_FINAL_MASTER
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-700 px-1">Command_Protocol</h3>
            <div className="space-y-2">
              {steps.map((s) => {
                const stat = job?.flowStatus?.[s.key] || "waiting";
                const isActive = activeStepKey === s.key || stat === "done";
                return (
                  <Button key={s.key} onClick={() => triggerFlow(s.key, s.webhook)} disabled={!isActive || !!isTriggering} className={`w-full h-auto p-4 justify-between border-none rounded-2xl transition-all duration-300 ${stat === "done" ? "bg-zinc-900 text-zinc-500" : isActive ? "bg-blue-600 text-white" : "bg-zinc-950/20 text-zinc-800 opacity-20"}`}>
                    <span className="text-[10px] font-black uppercase">{s.label}</span>
                    {stat === "processing" || isTriggering === s.key ? <Loader2 className="animate-spin w-4 h-4" /> : stat === "done" ? <RefreshCcw size={14} /> : <Play size={14} />}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetCard title="01_BASE_PRODUCT" src={job?.product_image_http} jobKey="none" icon={Box} colorClass="bg-orange-500" />
            <AssetCard title="02_CREATIVE_SCENE" src={job?.scene_image_http} jobKey="flow1_scene" icon={Sparkles} colorClass="bg-blue-500" />
            <AssetCard title="03_START_FRAME" src={job?.scene_image_with_product_http} jobKey="flow2_startframe" icon={ImageIcon} colorClass="bg-cyan-500" />
            <AssetCard title="04_END_FRAME" src={job?.scene_image_endframe_http} jobKey="flow3_endframe" icon={ImageIcon} colorClass="bg-indigo-500" />
            <AssetCard title="05_SILENT_RENDER" src={job?.video_url_without_sound_http} jobKey="flow4_video_silent" type="video" icon={Film} colorClass="bg-purple-500" />
            <AssetCard title="06_FINAL_MASTER" src={job?.video_url_with_sound_http} jobKey="flow6_muxing" type="video" icon={Play} colorClass="bg-green-500" />
          </div>
        </div>
      </div>
    </main>
  );
}
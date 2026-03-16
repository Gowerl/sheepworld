'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sparkles, ZoomIn, Play, Image as ImageIcon,
  Film, Mic, RefreshCcw, Download, Box, MapPin, Ruler,
  ArrowLeft, Activity, Code2, FileText, CheckCircle2, Lock
} from "lucide-react";

export default function JobDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [zoomImage, setZoomImage] = useState<{src: string, title: string} | null>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const getSafeId = () => {
    if (params?.id && params.id !== "index") return decodeURIComponent(params.id as string);
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/").filter(p => p && p !== "job" && p !== "index");
      if (pathParts.length > 0) return decodeURIComponent(pathParts[pathParts.length - 1]);
    }
    return "";
  };

  const id = getSafeId();

  useEffect(() => {
    setIsClient(true);
    if (!id || id === "index") return;
    
    const unsubscribe = onSnapshot(doc(db, "jobs", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setJob(data);
        // Sobald Firestore "done" meldet, geben wir das UI wieder frei
        if (isTriggering && data.flowStatus?.[isTriggering] === "done") {
          setIsTriggering(null);
          setLastAction("Success");
          setTimeout(() => setLastAction(null), 3000);
        }
      }
    });
    return () => unsubscribe();
  }, [id, isTriggering]);

  const steps = [
    { key: "flow1_scene", label: "1. Scene", webhook: "https://myc3.app.n8n.cloud/webhook/generate-scene" },
    { key: "flow2_startframe", label: "2. Startframe", webhook: "https://myc3.app.n8n.cloud/webhook/generate-startframe" },
    { key: "flow3_endframe", label: "3. Endframe", webhook: "https://myc3.app.n8n.cloud/webhook/generate-endframe" },
    { key: "flow4_video_silent", label: "4. Video", webhook: "https://myc3.app.n8n.cloud/webhook/generate-video-silent" },
    { key: "flow5_voiceover", label: "5. Voiceover", webhook: "https://myc3.app.n8n.cloud/webhook/generate-voiceover" },
    { key: "flow6_muxing", label: "6. Final Video", webhook: "https://myc3.app.n8n.cloud/webhook/mux-video" }
  ];

  const triggerFlow = async (flowKey: string, webhookUrl: string) => {
    if (isTriggering) return;
    
    // LOKALER LOCK: Verhindert Mehrfachklicks und zeigt Loader
    setIsTriggering(flowKey);
    setLastAction("Connecting to n8n...");

    try {
      // WICHTIG: Kein updateDoc hier! Wir warten rein auf die Antwort von n8n via Firestore
      const response = await fetch(webhookUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });

      if (response.ok) {
        setLastAction("Payload delivered. Processing...");
      } else {
        throw new Error("n8n unavailable");
      }
    } catch (e) { 
      console.error(e); 
      setLastAction("Link failed");
      setIsTriggering(null);
    }
  };

  if (!job) return (
    <div className="p-20 text-center bg-black min-h-screen text-white flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-blue-600 mb-4" />
      <p className="text-xs uppercase tracking-widest opacity-50 italic">Establishing Neural Link...</p>
    </div>
  );

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-black text-white relative">
      
      {isTriggering && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 text-center">
            <Loader2 className="animate-spin w-16 h-16 text-blue-500" />
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tighter">Command Executing</h2>
              <p className="text-xs text-zinc-500 font-mono italic">Sequence: {isTriggering}</p>
            </div>
          </div>
        </div>
      )}

      {zoomImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setZoomImage(null)}>
          <img src={zoomImage.src} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" alt="Zoom" />
        </div>
      )}

      <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
        <div className="space-y-4">
          <Button onClick={() => router.push("/")} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-[0.3em] font-black">
            <ArrowLeft size={14} /> [ DISCONNECT_FROM_FLEET ]
          </Button>
          <div className="space-y-1">
            <Badge className="bg-blue-500/5 text-blue-500 border-blue-500/20 font-mono px-3 mb-2 uppercase">Core Node: {id}</Badge>
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic leading-tight">
              {job?.product_shop_title || "PRODUCTION_LOG"}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-700 px-1">Command Protocol</h3>
            <div className="space-y-2">
              {steps.map((s, index) => {
                const stat = job?.flowStatus?.[s.key] || "waiting";
                const isDone = stat === "done";
                
                // Wir behandeln "isTriggering" lokal als Processing-State
                const isProcessing = isTriggering === s.key;

                // Step-Locking Logic
                const isFirstStep = index === 0;
                let isLocked = false;
                if (!isFirstStep) {
                  const prevStepKey = steps[index - 1].key;
                  isLocked = job?.flowStatus?.[prevStepKey] !== "done";
                }

                return (
                  <Button 
                    key={s.key} 
                    onClick={() => triggerFlow(s.key, s.webhook)} 
                    disabled={isProcessing || isTriggering !== null || isLocked}
                    className={"w-full h-auto p-4 justify-between border-none rounded-2xl transition-all duration-500 " + (
                      isDone ? "bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : 
                      isProcessing ? "bg-blue-900/40 text-blue-400 animate-pulse" : 
                      isLocked ? "bg-zinc-900/30 text-zinc-700 cursor-not-allowed opacity-40" :
                      "bg-zinc-900 text-zinc-400 hover:bg-blue-600 hover:text-white"
                    )}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                      {isLocked && <span className="text-[7px] uppercase opacity-40 font-bold tracking-tighter">Locked Sequence</span>}
                    </div>
                    {isDone ? <CheckCircle2 size={16} /> : 
                     isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : 
                     isLocked ? <Lock size={12} className="opacity-20" /> :
                     <Play size={14} />}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetCard title="01 BASE PRODUCT" src={job?.product_image_http} icon={Box} colorClass="bg-orange-500" />
            <AssetCard title="02 CREATIVE SCENE" src={job?.scene_image_http} icon={Sparkles} colorClass="bg-blue-500" />
            <AssetCard title="03 START FRAME" src={job?.scene_image_with_product_http} icon={ImageIcon} colorClass="bg-cyan-500" />
            <AssetCard title="04 END FRAME" src={job?.scene_image_endframe_http} icon={ImageIcon} colorClass="bg-indigo-500" />
            <AssetCard title="05 SILENT RENDER" src={job?.video_url_without_sound_http} type="video" icon={Film} colorClass="bg-purple-500" />
            <AssetCard title="06 FINAL MASTER" src={job?.video_url_with_sound_http} type="video" icon={Play} colorClass="bg-green-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10 border-t border-zinc-900">
             <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3">
                <Mic size={14} className="text-pink-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Aural Processing</span>
              </CardHeader>
              <CardContent className="p-8">
                {job?.audio_file_http ? (
                  <audio src={job.audio_file_http} controls className="w-full h-10 accent-pink-500" />
                ) : <div className="text-center text-[9px] text-zinc-800 uppercase font-bold tracking-widest italic opacity-20">Awaiting Signal...</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden lg:col-span-2 shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3">
                <Code2 size={14} className="text-orange-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Metadata Stream</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 divide-x divide-zinc-900 border-b border-zinc-900 bg-black/40">
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><MapPin size={12}/> Env</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.environment || "NULL"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><Sparkles size={12}/> Mood</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.mood || "NULL"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><Ruler size={12}/> Scale</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.product_width_cm}x{job?.product_height_cm} CM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function AssetCard({ title, src, type, icon: Icon, colorClass }: any) {
  return (
    <Card className="relative group border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-zinc-400 shadow-2xl">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-black/20">
        <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
          {Icon && <Icon size={14} className="opacity-50" />} {title}
        </CardTitle>
        {src && <div className={"w-2 h-2 rounded-full animate-pulse " + colorClass} />}
      </CardHeader>
      <CardContent className="p-0 relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {src ? (
          type === "video" ? (
            <video src={src} controls className="w-full h-full object-cover bg-black" />
          ) : (
            <img src={src} className="w-full h-full object-cover" alt={title} />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-10">
            <Activity className="w-6 h-6 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Asset Data</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
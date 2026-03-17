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
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const getCachedUrl = (url: string) => {
    if (!url) return "";
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${new Date().getTime()}`;
  };

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
        
        if (isTriggering && data.flowStatus?.[isTriggering] === "done") {
          setIsTriggering(null);
          setLastAction("Asset Synchronized");
          setTimeout(() => setLastAction(null), 3000);
        }
      }
    });
    return () => unsubscribe();
  }, [id, isTriggering]);

  const steps = [
    { key: "flow1_scene", label: "1. Scene", webhook: "https://myc3.app.n8n.cloud/webhook/generate-scene", db_field: "scene_image_http" },
    { key: "flow2_startframe", label: "2. Startframe", webhook: "https://myc3.app.n8n.cloud/webhook/generate-startframe", db_field: "scene_image_with_product_http" },
    { key: "flow3_endframe", label: "3. Endframe", webhook: "https://myc3.app.n8n.cloud/webhook/generate-endframe", db_field: "scene_image_endframe_http" },
    { key: "flow4_video_silent", label: "4. Video", webhook: "https://myc3.app.n8n.cloud/webhook/generate-video-silent", db_field: "video_url_without_sound_http" },
    { key: "flow5_voiceover", label: "5. Voiceover", webhook: "https://myc3.app.n8n.cloud/webhook/generate-voiceover", db_field: "audio_file_http" },
    { key: "flow6_muxing", label: "6. Final Video", webhook: "https://myc3.app.n8n.cloud/webhook/mux-video", db_field: "video_url_with_sound_http" }
  ];

  const approveStep = async (flowKey: string) => {
    try {
      await updateDoc(doc(db, "jobs", id), { [`flowStatus.${flowKey}`]: "approved" });
      setLastAction(`Step Verified`);
    } catch (e) { console.error(e); }
  };

  const triggerFlow = async (flowKey: string, webhookUrl: string, index: number) => {
    if (isTriggering) return;
    setIsTriggering(flowKey);
    
    try {
      const updates: any = {};
      
      if (index === 0) {
        const currentVersion = parseInt(job?.scene_version || "0");
        updates["scene_version"] = currentVersion + 1;
      }

      updates[`flowStatus.${flowKey}`] = "processing";
      
      for (let i = index + 1; i < steps.length; i++) {
        updates[`flowStatus.${steps[i].key}`] = "waiting";
      }

      for (let i = index; i < steps.length; i++) {
        if (steps[i].db_field) updates[steps[i].db_field] = null;
      }

      await updateDoc(doc(db, "jobs", id), updates);

      // DIREKTER TRIGGER (Bypass Proxy für Static Export)
      const response = await fetch(webhookUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });

      if (!response.ok) {
        // Falls CORS zuschlägt, wird dieser Block eventuell übersprungen, 
        // aber wir loggen es für den Fall von 4xx/5xx Fehlern
        const errText = await response.text();
        throw new Error(`n8n error: ${response.status} - ${errText}`);
      }

      setLastAction("Remote Trigger Active...");
    } catch (e) { 
      console.error("Trigger Flow Error:", e); 
      setIsTriggering(null);
      setLastAction("Sync Error (Check CORS)");
      setTimeout(() => setLastAction(null), 5000);
    }
  };

  if (!job) return <div className="p-20 text-center bg-black min-h-screen text-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-black text-white relative">
      
      {isTriggering && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="animate-spin w-16 h-16 text-blue-500 mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Syncing Node...</h2>
        </div>
      )}

      {lastAction && (
        <div className="fixed bottom-8 right-8 z-[10000] bg-blue-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl animate-bounce">
          {lastAction}
        </div>
      )}

      <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
        <div className="space-y-4">
          <Button onClick={() => router.push("/")} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-[0.3em] font-black italic">
            <ArrowLeft size={14} /> [ RETURN_TO_BASE ]
          </Button>
          <div className="space-y-1">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono px-3 mb-2 uppercase tracking-widest text-[9px]">
                REV: {job?.scene_version || "0"}
            </Badge>
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic leading-tight">
              {job?.product_shop_title || "PRODUCTION_LOG"}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-700 px-1">Pipeline Control</h3>
            <div className="space-y-4">
              {steps.map((s, index) => {
                const stat = job?.flowStatus?.[s.key] || "waiting";
                const isDone = stat === "done";
                const isApproved = stat === "approved";
                const isProcessing = stat === "processing" || isTriggering === s.key;

                const isFirstStep = index === 0;
                let isLocked = false;
                if (!isFirstStep) {
                  const prevStepKey = steps[index - 1].key;
                  isLocked = job?.flowStatus?.[prevStepKey] !== "approved";
                }

                return (
                  <div key={s.key} className="space-y-2">
                    <Button 
                      onClick={() => triggerFlow(s.key, s.webhook, index)} 
                      disabled={isProcessing || isTriggering !== null || (isLocked && !isApproved)}
                      className={"w-full h-auto p-4 justify-between border-none rounded-2xl transition-all duration-500 " + (
                        isApproved ? "bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : 
                        isDone ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        isProcessing ? "bg-blue-900/40 text-blue-400 animate-pulse" : 
                        isLocked ? "bg-zinc-900/30 text-zinc-800 opacity-40" :
                        "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 shadow-sm"
                      )}
                    >
                      <div className="flex flex-col items-start text-left gap-1">
                        <span className="text-xs font-black uppercase tracking-wider">
                          {isApproved && <Lock size={10} className="inline mr-1 text-green-500" />}
                          {s.label}
                        </span>
                        {isDone && !isApproved && <span className="text-[9px] uppercase text-white font-black bg-blue-600 px-2 py-0.5 rounded shadow-lg">Pending Review</span>}
                      </div>
                      {isApproved ? <CheckCircle2 size={18} /> : 
                       isDone ? <RefreshCcw size={16} className="text-blue-400" /> :
                       isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Play size={16} />}
                    </Button>

                    {isDone && !isApproved && (
                      <Button onClick={() => approveStep(s.key)} className="w-full h-9 bg-blue-600 hover:bg-white hover:text-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl">
                        Verify Step {index + 1}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetCard title="01 BASE PRODUCT" src={getCachedUrl(job?.product_image_http)} icon={Box} colorClass="bg-orange-500" />
            <AssetCard title="02 CREATIVE SCENE" src={getCachedUrl(job?.scene_image_http)} icon={Sparkles} colorClass="bg-blue-500" />
            <AssetCard title="03 START FRAME" src={getCachedUrl(job?.scene_image_with_product_http)} icon={ImageIcon} colorClass="bg-cyan-500" />
            <AssetCard title="04 END FRAME" src={getCachedUrl(job?.scene_image_endframe_http)} icon={ImageIcon} colorClass="bg-indigo-500" />
            <AssetCard title="05 SILENT RENDER" src={getCachedUrl(job?.video_url_without_sound_http)} type="video" icon={Film} colorClass="bg-purple-500" />
            <AssetCard title="06 FINAL MASTER" src={getCachedUrl(job?.video_url_with_sound_http)} type="video" icon={Play} colorClass="bg-green-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10 border-t border-zinc-900">
             <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3">
                <Mic size={14} className="text-pink-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Aural Data</span>
              </CardHeader>
              <CardContent className="p-8">
                {job?.audio_file_http ? (
                  <audio key={job.audio_file_http} src={getCachedUrl(job.audio_file_http)} controls className="w-full h-10 accent-pink-500" />
                ) : <div className="text-center text-[9px] text-zinc-800 uppercase font-bold tracking-widest italic opacity-20">Awaiting Audio Stream...</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden lg:col-span-2 shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3">
                <Code2 size={14} className="text-orange-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Metadata Context</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 divide-x divide-zinc-900 border-b border-zinc-900 bg-black/40">
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><MapPin size={12}/> Environment</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.environment || "N/A"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><Sparkles size={12}/> Mood</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.mood || "N/A"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-1 flex items-center gap-2"><Ruler size={12}/> Proportions</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.product_width_cm}x{job?.product_height_cm} cm</p>
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
    <Card className="relative group border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-zinc-500 shadow-2xl">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-black/40 border-b border-white/5">
        <CardTitle className="text-[10px] uppercase tracking-widest font-black text-zinc-500 flex items-center gap-2">
          {Icon && <Icon size={14} />} {title}
        </CardTitle>
        {src && <div className={"w-2 h-2 rounded-full " + colorClass} />}
      </CardHeader>
      <CardContent className="p-0 relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {src ? (
          type === "video" ? (
            <video key={src} src={src} controls className="w-full h-full object-cover bg-black" />
          ) : (
            <img key={src} src={src} className="w-full h-full object-cover" alt={title} />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-10">
            <Activity className="w-6 h-6 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Asset...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
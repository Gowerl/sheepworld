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
      if (docSnapshot.exists()) setJob(docSnapshot.data());
    });
    return () => unsubscribe();
  }, [id]);

  const steps = [
    { key: "flow1_scene", label: "1. Scene", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-scene" },
    { key: "flow2_startframe", label: "2. Startframe", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-startframe" },
    { key: "flow3_endframe", label: "3. Endframe", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-endframe" },
    { key: "flow4_video_silent", label: "4. Video", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-video-silent" },
    { key: "flow5_voiceover", label: "5. Voiceover", webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-voiceover" },
    { key: "flow6_muxing", label: "6. Final Video", webhook: "https://myc3.app.n8n.cloud/webhook-test/mux-video" }
  ];

  const triggerFlow = async (flowKey: string, webhookUrl: string) => {
    setIsTriggering(flowKey);
    try {
      await fetch(webhookUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });
    } catch (e) { console.error(e); } finally { setIsTriggering(null); }
  };

  const AssetCard = ({ title, src, type, jobKey, icon: Icon, colorClass }: any) => (
    <Card className="relative border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all hover:border-zinc-400">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-black/20">
        <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
          {Icon && <Icon size={14} />} {title}
        </CardTitle>
        {src && <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`} />}
      </CardHeader>
      <CardContent className="p-0 relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {src ? (
          type === "video" ? (
            <video src={src} controls className="w-full h-full object-cover" />
          ) : (
            <div className="cursor-zoom-in w-full h-full" onClick={() => setZoomImage({src, title})}>
              <img src={src} className="w-full h-full object-cover" alt={title} />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="text-white w-6 h-6" />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            <Activity className="w-6 h-6" />
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
      <p className="text-[10px] opacity-20">Target ID: {id || "Resolving..."}</p>
    </div>
  );

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-black text-white">
      {zoomImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-8" onClick={() => setZoomImage(null)}>
          <img src={zoomImage.src} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" alt="Zoom" />
        </div>
      )}

      <div className="flex justify-between items-end border-b border-zinc-900 pb-10">
        <div className="space-y-4">
          <Button onClick={() => router.push("/")} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-[0.3em] font-black">
            <ArrowLeft size={14} /> [ DISCONNECT_FROM_FLEET ]
          </Button>
          <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic">
            {job?.product_shop_title || "ALPHA_SEQUENCE"}
          </h1>
        </div>
        {job?.video_url_with_sound_http && (
          <Button onClick={() => window.open(job.video_url_with_sound_http, "_blank")} className="bg-white text-black font-black h-16 px-12 rounded-2xl">
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
                return (
                  <Button key={s.key} onClick={() => triggerFlow(s.key, s.webhook)} disabled={!!isTriggering} className={`w-full h-auto p-4 justify-between border-none rounded-2xl bg-zinc-900 text-zinc-500`}>
                    <span className="text-[10px] font-black uppercase">{s.label}</span>
                    {isTriggering === s.key ? <Loader2 className="animate-spin w-4 h-4" /> : <Play size={14} />}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetCard title="01_BASE_PRODUCT" src={job?.product_image_http} icon={Box} colorClass="bg-orange-500" />
            <AssetCard title="02_CREATIVE_SCENE" src={job?.scene_image_http} icon={Sparkles} colorClass="bg-blue-500" />
            <AssetCard title="03_START_FRAME" src={job?.scene_image_with_product_http} icon={ImageIcon} colorClass="bg-cyan-500" />
            <AssetCard title="04_END_FRAME" src={job?.scene_image_endframe_http} icon={ImageIcon} colorClass="bg-indigo-500" />
            <AssetCard title="05_SILENT_RENDER" src={job?.video_url_without_sound_http} type="video" icon={Film} colorClass="bg-purple-500" />
            <AssetCard title="06_FINAL_MASTER" src={job?.video_url_with_sound_http} type="video" icon={Play} colorClass="bg-green-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-10 border-t border-zinc-900">
            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic size={14} className="text-pink-500"/>
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Aural_Processing</span>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {job?.audio_file_http ? (
                  <audio src={job.audio_file_http} controls className="w-full h-10" />
                ) : <div className="text-center text-[9px] text-zinc-800 uppercase font-bold italic">Awaiting Sonic DNA...</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-900 rounded-3xl overflow-hidden lg:col-span-2 shadow-2xl">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3">
                <Code2 size={14} className="text-orange-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Metadata_Pointers</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 divide-x divide-zinc-900 border-b border-zinc-900 bg-black/40">
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2"><MapPin size={12}/> World</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.environment || "UNDEFINED"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2"><Sparkles size={12}/> Mood</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.mood || "UNDEFINED"}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2"><Ruler size={12}/> Units</p>
                    <p className="text-xs font-bold text-zinc-400">{job?.product_width_cm}x{job?.product_height_cm}</p>
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
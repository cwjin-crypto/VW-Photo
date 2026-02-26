import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Download, 
  Trash2, 
  User, 
  Building2, 
  MapPin, 
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  ChevronRight,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dealer, Showroom, BackgroundType, HistoryItem, DEALER_SHOWROOMS } from "./types";
import { generateSalesRepImages } from "./services/geminiService";

export default function App() {
  const [name, setName] = useState("");
  const [dealer, setDealer] = useState<Dealer>("마이스터모터스");
  const [showroom, setShowroom] = useState<Showroom>("");
  const [background, setBackground] = useState<BackgroundType>("solid");
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"studio" | "history">("studio");
  const [generatedResult, setGeneratedResult] = useState<{
    front: string;
    side: string;
    full: string;
  } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (DEALER_SHOWROOMS[dealer]) {
      setShowroom(DEALER_SHOWROOMS[dealer][0]);
    }
  }, [dealer]);

  const fetchHistory = async () => {
    try {
      const localData = localStorage.getItem("vw_studio_history");
      if (localData) {
        setHistory(JSON.parse(localData));
      }

      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        localStorage.setItem("vw_studio_history", JSON.stringify(data));
      }
    } catch (error) {
      console.log("Using local storage for history");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - sourceImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSourceImage = (index: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!name || sourceImages.length === 0) {
      alert("이름과 사진을 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      const results = await generateSalesRepImages(sourceImages, background, name);
      
      if (results) {
        const resultData = {
          front: results.front,
          side: results.side,
          full: results.full
        };
        setGeneratedResult(resultData);

        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            dealer,
            showroom,
            image_front: results.front,
            image_side: results.side,
            image_full: results.full,
            background_type: background
          })
        }).catch(() => console.log("API Save failed"));

        const newItem: HistoryItem = {
          id: Date.now(),
          name,
          dealer,
          showroom,
          image_front: results.front,
          image_side: results.side,
          image_full: results.full,
          background_type: background,
          created_at: new Date().toISOString()
        };
        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("vw_studio_history", JSON.stringify(updatedHistory));
      }
    } catch (error: any) {
      console.error("Generation failed", error);
      alert(error.message || "이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem("vw_studio_history", JSON.stringify(updatedHistory));
      await fetch(`/api/history/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = base64;
    link.download = `${name}_${filename}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#001E50] rounded-full flex items-center justify-center text-white font-bold text-xl">
              W
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#001E50]">VW Photo Studio</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Sales Representative Profile Platform</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "studio" ? "bg-white shadow-sm text-[#001E50]" : "text-slate-500 hover:text-slate-700"}`}
            >
              스튜디오
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === "history" ? "bg-white shadow-sm text-[#001E50]" : "text-slate-500 hover:text-slate-700"}`}
            >
              히스토리
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "studio" ? (
            <motion.div 
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-bottom border-slate-100">
                      <User className="w-5 h-5 text-blue-600" />
                      <h2 className="font-bold text-slate-800">정보 입력</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">이름</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="성함을 입력하세요"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">딜러사</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={dealer}
                            onChange={(e) => setDealer(e.target.value as Dealer)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white transition-all"
                          >
                            {Object.keys(DEALER_SHOWROOMS).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">전시장</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select 
                            value={showroom}
                            onChange={(e) => setShowroom(e.target.value as Showroom)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white transition-all"
                          >
                            {DEALER_SHOWROOMS[dealer].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        배경 선택
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(["solid", "logo", "showroom"] as BackgroundType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => setBackground(type)}
                            className={`px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                              background === type 
                                ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" 
                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            {type === "solid" && "단색"}
                            {type === "logo" && "로고 포함"}
                            {type === "showroom" && "전시장"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        사진 업로드 (최대 3장)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {sourceImages.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeSourceImage(idx)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                        {sourceImages.length < 3 && (
                          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                            <span className="text-[10px] text-slate-400 mt-1 group-hover:text-blue-500">추가</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple />
                          </label>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !name || sourceImages.length === 0}
                      className="w-full py-4 bg-[#001E50] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00143a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          이미지 생성 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          이미지 생성하기
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  {generatedResult ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800">생성 결과</h2>
                        <button 
                          onClick={() => setGeneratedResult(null)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          다시 만들기
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        {[
                          { label: "정면 샷", key: "front" as const },
                          { label: "측면 샷 (45도)", key: "side" as const },
                          { label: "전신 샷", key: "full" as const }
                        ].map((shot) => (
                          <div key={shot.key} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden group">
                            <div className="aspect-[4/3] relative bg-slate-200">
                              <img src={generatedResult[shot.key]} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => downloadImage(generatedResult[shot.key], shot.key)}
                                  className="bg-white text-[#001E50] px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                                >
                                  <Download className="w-4 h-4" />
                                  다운로드
                                </button>
                              </div>
                            </div>
                            <div className="p-4 flex items-center justify-between bg-white">
                              <span className="font-bold text-slate-700">{shot.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">High Resolution • AI Generated</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full min-h-[400px] bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-600">준비 완료</h3>
                        <p className="text-sm text-slate-400 max-w-[240px] mx-auto">정보를 입력하고 생성하기 버튼을 누르면 AI 프로필이 이곳에 나타납니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600" />
                  생성 히스토리
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                  총 {history.length}건
                </span>
              </div>

              {history.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <History className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-medium">아직 생성된 히스토리가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                      <div className="grid grid-cols-3 h-32 bg-slate-100">
                        <img src={item.image_front} className="w-full h-full object-cover border-r border-white/50" />
                        <img src={item.image_side} className="w-full h-full object-cover border-r border-white/50" />
                        <img src={item.image_full} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Building2 className="w-3 h-3" />
                              {item.dealer} • {item.showroom}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => downloadImage(item.image_front, "front")}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              정면
                            </button>
                            <button 
                              onClick={() => downloadImage(item.image_side, "side")}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              측면
                            </button>
                            <button 
                              onClick={() => downloadImage(item.image_full, "full")}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              전신
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">© 2026 Volkswagen Korea Sales Representative Photo Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

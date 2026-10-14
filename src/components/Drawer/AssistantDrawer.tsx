import React, { useState } from 'react';
import { MapPoint } from '../../types/index.ts';
import { askAssistant } from '../../services/apiClient.ts';
import {
  X,
  Bot,
  Send,
  AlertTriangle,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPointById: (id: string) => void;
  allPoints: MapPoint[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidenceIds?: string[];
  isDemoNotice?: string;
  modelUsed?: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPointById,
  allPoints,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Sou o Assistente Cívico do Mapa de Planaltina, Goiás (IBGE 5217609). Posso responder perguntas sobre os pontos demonstrativos cadastrados nas 9 categorias (Saúde, Educação, Transporte, Segurança, Serviços Públicos, Comércio, Lazer, Meio Ambiente e Rural).',
      isDemoNotice: 'Modo demonstrativo — locais ilustrativos, não use para deslocamento.',
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await askAssistant({
        message: query,
        history: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        evidenceIds: response.evidenceIds,
        isDemoNotice: response.isDemoNotice,
        modelUsed: response.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na resposta do assistente.';
      setErrorNotice(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointName = (id: string) => {
    const pt = allPoints.find((p) => p.id === id);
    return pt ? pt.name : id;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistenteTitulo"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col border-l border-neutral-200 font-sans animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="p-4 bg-[#355E3B] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-white/20 text-[#E5B744]">
            <Bot size={22} />
          </span>
          <div>
            <h2 id="assistenteTitulo" className="text-sm font-bold leading-tight">
              Assistente Cívico Local
            </h2>
            <p className="text-[11px] text-white/80">
              Planaltina, Goiás • Corpus Restrito & Não-Alucinação
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Fechar assistente"
          onClick={onClose}
          className="touch-target w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-[#FFF9E6] border-b border-[#E5B744]/40 px-3.5 py-2 flex items-center gap-2 text-xs text-[#78350F]">
        <Info size={15} className="shrink-0 text-amber-700" />
        <span className="text-[11px] leading-tight font-medium">
          As respostas são geradas estritamente a partir do catálogo demonstrativo (DEMO) carregado em memória.
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#F5F0E6]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#355E3B] text-white rounded-br-none shadow-sm'
                  : 'bg-white text-[#121E14] rounded-bl-none shadow-sm border border-neutral-200'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>

              {/* Evidence Badges */}
              {msg.evidenceIds && msg.evidenceIds.length > 0 && (
                <div className="mt-3 pt-2 border-t border-neutral-100 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500">
                    Locais Citados no Catálogo (Clique para ver no mapa):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.evidenceIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          onSelectPointById(id);
                          onClose();
                        }}
                        className="touch-target px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#355E3B] text-[11px] font-bold border border-emerald-300 flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <MapPin size={12} />
                        <span className="truncate max-w-[200px]">
                          {getPointName(id)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {msg.isDemoNotice && (
                <p className="mt-2 text-[10px] text-amber-800 font-semibold italic">
                  * {msg.isDemoNotice}
                </p>
              )}
            </div>

            {msg.modelUsed && (
              <span className="text-[10px] text-neutral-500 px-1 font-mono">
                fonte: {msg.modelUsed}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl w-fit shadow-sm text-xs text-neutral-600 animate-pulse border border-neutral-200">
            <Sparkles size={16} className="text-[#BA623D] animate-spin" />
            <span>Consultando corpus municipal...</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-white border-t border-neutral-200 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        {[
          'Onde tem UBS demonstrativa?',
          'Quais escolas estão no catálogo?',
          'Existe área de preservação rural?',
        ].map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => {
              setInputValue(sug);
            }}
            className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 whitespace-nowrap"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pergunte sobre serviços em Planaltina, Goiás..."
          className="flex-1 py-2.5 px-3 bg-neutral-100 rounded-xl text-xs text-[#121E14] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#355E3B]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="touch-target w-10 h-10 rounded-xl bg-[#355E3B] hover:bg-[#27472c] text-white flex items-center justify-center shadow disabled:opacity-50 active:scale-95 transition-all"
          aria-label="Enviar pergunta"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

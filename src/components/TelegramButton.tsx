import { MessageCircle } from "lucide-react";

export const TelegramButton = () => (
  <a
    href="https://t.me/envologia"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
  >
    <MessageCircle className="w-5 h-5" />
    <span className="text-sm font-medium">envologia</span>
  </a>
);

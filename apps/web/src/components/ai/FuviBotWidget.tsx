'use client';

import { useFuviBotStore } from '@/store/fuvibot.store';
import { FuviBotChat } from './FuviBotChat';

export function FuviBotWidget() {
  const { isOpen, toggle, close } = useFuviBotStore();

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <>
          {/* Backdrop trên mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={close}
          />

          {/* Panel */}
          <div className="fixed bottom-20 right-5 z-50 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <FuviBotChat />
          </div>
        </>
      )}

      {/* Floating button */}
      <button
        onClick={toggle}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
            : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:shadow-blue-300 hover:shadow-xl hover:scale-110'
        }`}
        title={isOpen ? 'Đóng FuviBot' : 'Mở FuviBot AI'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </>
  );
}

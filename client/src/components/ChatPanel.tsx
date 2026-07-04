import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';

export function ChatPanel({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message) {
      return;
    }
    onSend(message);
    setText('');
  }

  return (
    <div className="flex h-48 flex-col rounded-lg bg-gray-800 p-3">
      <h3 className="mb-2 text-sm font-semibold text-gray-300">Chat</h3>
      <div ref={scrollRef} className="mb-2 flex-1 space-y-1 overflow-y-auto text-sm">
        {messages.map((message, index) => (
          <p key={index}>
            <span className="font-semibold text-emerald-400">{message.displayName}:</span>{' '}
            <span className="text-gray-200">{message.message}</span>
          </p>
        ))}
        {messages.length === 0 && <p className="text-gray-500">Nenhuma mensagem</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={200}
          placeholder="Mensagem..."
          className="flex-1 rounded bg-gray-700 px-2 py-1.5 text-sm outline-none"
        />
        <button type="submit" className="rounded bg-gray-600 px-3 py-1.5 text-sm hover:bg-gray-500">
          Enviar
        </button>
      </form>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useCardTheme, useSetCardTheme, useAvailableThemes } from '../hooks/useCardTheme';
import { CardRenderer } from '../components/cards/CardRenderer';
import { useUIStore } from '../store/uiStore';
import { TABLE_LAYOUTS } from '../lib/table-layout/seatPositions';

export default function SettingsPage() {
  const navigate = useNavigate();
  const currentTheme = useCardTheme();
  const setCardTheme = useSetCardTheme();
  const availableThemes = useAvailableThemes();

  const selectedLayout = useUIStore((s) => s.selectedTableLayout);
  const setTableLayout = useUIStore((s) => s.setTableLayout);
  const enableAnimations = useUIStore((s) => s.enableAnimations);
  const setEnableAnimations = useUIStore((s) => s.setEnableAnimations);

  const layouts = Object.values(TABLE_LAYOUTS);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-400">Configurações</h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
        >
          Voltar
        </button>
      </div>

      <section className="mb-6 rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-300">Tema de Cartas</h2>
        <div className="space-y-4">
          {availableThemes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => setCardTheme(theme.id)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                currentTheme.id === theme.id
                  ? 'border-emerald-400 bg-emerald-900/20'
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-200">{theme.name}</h3>
                  <p className="text-sm text-gray-400">{theme.description}</p>
                </div>
                <div className="flex gap-2">
                  <CardRenderer card="Ah" theme={theme} />
                  <CardRenderer card="Ks" theme={theme} />
                  <CardRenderer theme={theme} hidden />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-300">Layout da Mesa</h2>
        <div className="space-y-2">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              onClick={() => setTableLayout(layout.id)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                selectedLayout === layout.id
                  ? 'border-emerald-400 bg-emerald-900/20'
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-500'
              }`}
            >
              <h3 className="font-semibold text-gray-200">{layout.name}</h3>
              <p className="text-sm text-gray-400">{layout.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-300">Animações</h2>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={enableAnimations}
            onChange={(e) => setEnableAnimations(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-gray-200">Ativar animações de cartas</span>
        </label>
      </section>
    </div>
  );
}

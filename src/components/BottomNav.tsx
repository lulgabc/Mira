import type { JSX } from 'preact';
import type { Translate } from '../i18n';
import type { Tab } from '../lib/types';
import { IconCalendar, IconInsights, IconSettings, IconToday } from './Icons';

interface BottomNavProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
  t: Translate;
}

const ITEMS: {
  id: Tab;
  icon: (props: { size?: number }) => JSX.Element;
  key: 'nav.today' | 'nav.calendar' | 'nav.insights' | 'nav.settings';
}[] = [
  { id: 'today', icon: IconToday, key: 'nav.today' },
  { id: 'calendar', icon: IconCalendar, key: 'nav.calendar' },
  { id: 'insights', icon: IconInsights, key: 'nav.insights' },
  { id: 'settings', icon: IconSettings, key: 'nav.settings' },
];

export function BottomNav({ tab, onChange, t }: BottomNavProps) {
  return (
    <nav class="bottom-nav" aria-label={t('a11y.nav')}>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            class={`nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon size={21} />
            <span>{t(item.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}

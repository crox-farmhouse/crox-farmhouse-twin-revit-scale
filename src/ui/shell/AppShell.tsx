import type { ComponentType, JSX } from 'preact';
import { isMobile, navigatorOpen, roomPanelOpen, toast } from '../../state/shell-store.ts';
import { HelpOverlay } from './HelpOverlay.tsx';
import { RoomNavigator } from './RoomNavigator.tsx';
import { RoomPanel } from './RoomPanel.tsx';
import { SettingsModal } from './SettingsModal.tsx';
import { ShellContext } from './shell-context.ts';
import type { ShellController } from './shell-controller.ts';
import { ToolDock } from './ToolDock.tsx';
import { TopBar } from './TopBar.tsx';

function Toast(): JSX.Element | null {
  const t = toast.value;
  if (!t) return null;
  return (
    <div class="shell-toast" role="status" aria-live="polite" key={t.id}>
      {t.text}
    </div>
  );
}

function MobileScrim(): JSX.Element | null {
  if (!isMobile.value || !(navigatorOpen.value || roomPanelOpen.value)) return null;
  return (
    <div
      class="shell-scrim"
      onClick={() => {
        navigatorOpen.value = false;
        roomPanelOpen.value = false;
      }}
    />
  );
}

export interface AppShellProps {
  readonly ctl: ShellController;
  /** Developer drawer, injected by the composition root (keeps src/ui/dev out of the shell). */
  readonly devDrawer?: ComponentType;
}

export function AppShell({ ctl, devDrawer: DevDrawer }: AppShellProps): JSX.Element {
  return (
    <ShellContext.Provider value={ctl}>
      <TopBar />
      <MobileScrim />
      <RoomNavigator />
      <RoomPanel />
      <ToolDock />
      {DevDrawer && <DevDrawer />}
      <Toast />
      <SettingsModal />
      <HelpOverlay />
    </ShellContext.Provider>
  );
}

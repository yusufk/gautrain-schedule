import './ReloadPrompt.css';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="reload-prompt-container">
      <div className="reload-prompt-content">
        <div className="reload-prompt-icon">
          {offlineReady ? '✅' : '🔄'}
        </div>
        <div className="reload-prompt-text">
          {offlineReady ? (
            <span>App ready to work offline</span>
          ) : (
            <span><strong>Update Available!</strong><br/>New version ready to install</span>
          )}
        </div>
        <div className="reload-prompt-actions">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="reload-btn"
            >
              Update Now
            </button>
          )}
          <button
            onClick={close}
            className="close-btn"
          >
            {needRefresh ? 'Later' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt;

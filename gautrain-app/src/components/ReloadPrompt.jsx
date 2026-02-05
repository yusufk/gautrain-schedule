import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      left: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      padding: '16px',
      background: '#16213e',
      border: '2px solid #e94560',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ color: '#fff' }}>
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click reload to update.</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload
          </button>
        )}
        <button
          onClick={close}
          style={{
            flex: 1,
            padding: '8px 16px',
            background: 'transparent',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;

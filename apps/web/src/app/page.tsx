export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <main style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#1976d2'
        }}>
          casto
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '2rem',
          color: '#666'
        }}>
          オーディション開催から終了まで一元管理できるプラットフォーム
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>主催者</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              募集〜当日運営まで一元管理
            </p>
          </div>
          <div style={{ 
            padding: '1.5rem', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>応募者</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              LINEで簡単応募・結果確認
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a 
            href="/liff" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#1976d2', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            応募者ページ
          </a>
          <a 
            href="/organizer" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#dc004e', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            主催者ページ
          </a>
        </div>
      </main>

      <footer style={{ 
        marginTop: '3rem', 
        fontSize: '0.9rem', 
        color: '#999' 
      }}>
        <p>開発環境 - API: <a href="http://localhost:8787/api/v1/health" target="_blank" rel="noopener">Health Check</a></p>
      </footer>
    </div>
  );
}

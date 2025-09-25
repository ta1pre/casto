import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header style={{
      backgroundColor: '#1976d2',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Casto
        </h1>
        <nav style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <Link
            href="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            ホーム
          </Link>
          <Link
            href="/liff"
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            応募者ページ
          </Link>
        </nav>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {isAuthenticated && user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {user.pictureUrl && (
                <Image
                  src={user.pictureUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              )}
              <span>
                {user.displayName || user.name || user.email}
              </span>
              <span style={{
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <Link
              href="/login"
              style={{
                backgroundColor: 'white',
                color: '#1976d2',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
            >
              ログイン
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

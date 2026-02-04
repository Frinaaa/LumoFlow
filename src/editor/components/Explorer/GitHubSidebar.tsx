import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';

export const GitHubSidebar: React.FC = () => {
    const { user } = useUserStore();
    const [repositories, setRepositories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.githubId) {
            fetchRepos();
        }
    }, [user]);

    const fetchRepos = async () => {
        setLoading(true);
        try {
            // This would normally call an API to get user repos
            // For now we'll simulate it or use cached data
            console.log('Fetching GitHub repos for:', user.githubId);
            // Mock data
            setRepositories([
                { id: 1, name: 'LumoFlow', description: 'Interactive algorithm visualization', stars: 12 },
                { id: 2, name: 'Algorithm-Playground', description: 'Data structures in JS', stars: 5 }
            ]);
        } catch (error) {
            console.error('Failed to fetch GitHub repos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        const clientId = 'Ov23liAatI8vYt270N88'; // From authService or config
        const redirectUri = window.location.origin + '/#/auth/github/callback';
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user,repo,gist`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#ccc' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #3c3c3c', fontSize: '11px', fontWeight: 600, color: '#888' }}>
                GITHUB CONNECTION
            </div>

            {!user?.githubId ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <i className="fa-brands fa-github" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <p style={{ fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                        Connect your GitHub account to sync your projects and use advanced AI features.
                    </p>
                    <button
                        onClick={handleLogin}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#24292e',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: 500
                        }}
                    >
                        <i className="fa-brands fa-github"></i>
                        Sign in with GitHub
                    </button>
                </div>
            ) : (
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                            src={user.avatar || 'https://github.com/identicons/jasonlong.png'}
                            alt="Avatar"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #00f2ff' }}
                        />
                        <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{user.name || user.username}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>Connected via GitHub</div>
                        </div>
                    </div>

                    <div style={{ padding: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#555', marginBottom: '12px', letterSpacing: '0.5px' }}>
                            REPOSITORIES
                        </div>
                        {loading ? (
                            <div style={{ color: '#666', fontSize: '12px' }}>Loading...</div>
                        ) : repositories.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {repositories.map(repo => (
                                    <div key={repo.id} style={{
                                        padding: '10px',
                                        background: '#252526',
                                        borderRadius: '6px',
                                        border: '1px solid #333',
                                        cursor: 'pointer'
                                    }}>
                                        <div style={{ color: '#00f2ff', fontWeight: 500, fontSize: '13px' }}>{repo.name}</div>
                                        <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>{repo.description}</div>
                                        <div style={{ fontSize: '10px', color: '#555', marginTop: '8px' }}>
                                            <i className="fa-regular fa-star"></i> {repo.stars} stars
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: '#666', fontSize: '12px' }}>No repositories found.</div>
                        )}
                    </div>

                    <div style={{ padding: '12px', marginTop: 'auto', borderTop: '1px solid #333' }}>
                        <button
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'transparent',
                                border: '1px solid #444',
                                color: '#d9534f',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Disconnect GitHub
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

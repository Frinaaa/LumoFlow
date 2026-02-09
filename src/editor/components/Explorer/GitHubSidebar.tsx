import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../stores/userStore';
import { useGitOperations } from '../../hooks/useGitOperations';
import { useFileStore } from '../../stores/fileStore';
import { useGitStore } from '../../stores/gitStore';
import authService from '../../../services/authService';

export const GitHubSidebar: React.FC = () => {
    const { user } = useUserStore();
    const { workspacePath } = useFileStore();
    const {
        checkStatus,
        cloneRepository,
        commitChanges,
        syncChanges,
        getHistory,
    } = useGitOperations();

    // Subscribe to gitStore
    const branch = useGitStore((state: any) => state.branch);
    const changes = useGitStore((state: any) => state.changes);
    const isRepo = useGitStore((state: any) => state.isRepo);
    const gitLoading = useGitStore((state: any) => state.loading);

    const [isConnected, setIsConnected] = useState(false);
    const [repositories, setRepositories] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [cloudProjects, setCloudProjects] = useState<any[]>([]);
    const [loadingCloud, setLoadingCloud] = useState(false);
    const [gitRemotes, setGitRemotes] = useState<any[]>([]);
    const [loadingGitRemotes, setLoadingGitRemotes] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'source-control' | 'remotes'>('source-control');
    const [cloningRepo, setCloningRepo] = useState<string | null>(null);
    const [changesExpanded, setChangesExpanded] = useState(true);
    const [commitsExpanded, setCommitsExpanded] = useState(false);

    // Check GitHub connection
    useEffect(() => {
        const token = localStorage.getItem('github_token');
        if (token) {
            setIsConnected(true);
            fetchRepos(token);
        }

        if (user?._id || user?.id) {
            fetchCloudProjects();
        }

        if (isRepo) {
            fetchGitRemotes();
        }
    }, [user, isRepo]);

    // Auto-check when workspace opens
    useEffect(() => {
        if (workspacePath) {
            checkStatus();
        }
    }, [workspacePath]);

    // Fetch history when repo detected
    useEffect(() => {
        if (isRepo) {
            getHistory().then(commits => setHistory(commits || []));
        }
    }, [isRepo]);

    const fetchRepos = async (token: string) => {
        setLoadingRepos(true);
        try {
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const formatted = data.map((repo: any) => ({
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    stars: repo.stargazers_count,
                    url: repo.clone_url,
                    html_url: repo.html_url
                }));
                formatted.sort((a: any, b: any) => b.stars - a.stars);
                setRepositories(formatted);
            }
        } catch (error) {
            console.error('Failed to fetch repos:', error);
        } finally {
            setLoadingRepos(false);
        }
    };

    const fetchCloudProjects = async () => {
        const userId = user?._id || user?.id;
        if (!userId || !(window as any).api?.loadUserProjects) return;

        setLoadingCloud(true);
        try {
            const res = await (window as any).api.loadUserProjects(userId);
            if (res.success) {
                setCloudProjects(res.projects || []);
            }
        } catch (error) {
            console.error('Failed to fetch cloud projects:', error);
        } finally {
            setLoadingCloud(false);
        }
    };

    const fetchGitRemotes = async () => {
        if (!workspacePath || !(window as any).api?.gitRemote) return;

        setLoadingGitRemotes(true);
        try {
            const res = await (window as any).api.gitRemote({ action: 'list', repoPath: workspacePath });
            if (res.success) {
                // Remove duplicates (fetch/push)
                const uniqueRemotes = Array.from(new Set(res.remotes.map((r: any) => r.name)))
                    .map(name => res.remotes.find((r: any) => r.name === name));
                setGitRemotes(uniqueRemotes);
            }
        } catch (error) {
            console.error('Failed to fetch git remotes:', error);
        } finally {
            setLoadingGitRemotes(false);
        }
    };

    const handleClone = async (repoUrl: string, repoId: string) => {
        setCloningRepo(repoId);
        const res = await cloneRepository(repoUrl);
        setCloningRepo(null);

        if (res.success) {
            console.log('Cloned successfully');
        } else {
            alert('Clone failed: ' + res.error);
        }
    };

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            alert('Please enter a commit message');
            return;
        }

        console.log('🔵 Starting commit with message:', commitMessage);
        const res = await commitChanges(commitMessage);
        console.log('🔵 Commit result:', res);

        if (res.success) {
            console.log('✅ Commit successful!');
            setCommitMessage('');
            getHistory().then(commits => setHistory(commits || []));

            // Ask if user wants to push to GitHub
            const shouldPush = window.confirm('✅ Changes committed locally!\n\nDo you want to push to GitHub now?');
            if (shouldPush) {
                console.log('🔵 Pushing to GitHub...');
                const pushRes = await syncChanges();
                if (pushRes.success) {
                    alert('✅ Changes pushed to GitHub successfully!');
                } else {
                    alert('❌ Push failed: ' + (pushRes.error || 'Unknown error') + '\n\nYou can try again using the "Sync Changes" button.');
                }
            }
        } else {
            console.error('❌ Commit failed:', res);

            // Better error messages
            let errorMsg = res.error || res.message || 'Unknown error';

            if (errorMsg.includes('nothing to commit')) {
                alert('ℹ️ No changes to commit. Make sure you have saved your files.');
            } else if (errorMsg.includes('Author identity unknown') || errorMsg.includes('Please tell me who you are')) {
                alert('⚠️ Git identity not configured. Please set your name and email in settings.');
            } else {
                alert('❌ Commit failed: ' + errorMsg);
            }
        }
    };

    const handleSync = async () => {
        console.log('🔵 Syncing changes...');
        const res = await syncChanges();
        console.log('🔵 Sync result:', res);

        if (res.success) {
            getHistory().then(commits => setHistory(commits || []));
            alert('✅ Changes synced with GitHub successfully!');
        } else {
            alert('Sync failed: ' + res.error);
        }
    };

    const handleLogin = async () => {
        const clientId = 'Ov23liH24VR3ImiPJBlv';
        const redirectUri = 'http://localhost:3000/auth/github/callback';
        const scope = 'user,repo,gist';
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

        try {
            // @ts-ignore
            await window.api.openExternalURL(authUrl);

            // @ts-ignore
            window.api.onAuthCallback('github', async (data: any) => {
                const { code, error } = data;
                // @ts-ignore
                window.api.removeAuthListener('github');

                if (error) {
                    console.error('GitHub login error:', error);
                    return;
                }

                if (code) {
                    try {
                        const res = await authService.githubOAuth(code);
                        if (res.success) {
                            setIsConnected(true);
                            const token = localStorage.getItem('github_token');
                            if (token) fetchRepos(token);
                        }
                    } catch (e: any) {
                        console.error('Auth service error:', e);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to open external URL:', error);
        }
    };

    const getStatusColor = (status: string) => {
        if (status.includes('M')) return '#e2c08d';
        if (status.includes('?') || status.includes('A')) return '#73c991';
        if (status.includes('D')) return '#c74e39';
        return '#cccccc';
    };

    const getStatusLetter = (status: string) => {
        if (status.includes('?')) return 'U';
        return status.trim().charAt(0) || 'M';
    };

    // State for the ellipsis menu
    const [showMenu, setShowMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const closeMenu = () => setShowMenu(false);
        if (showMenu) {
            window.addEventListener('click', closeMenu);
        }
        return () => window.removeEventListener('click', closeMenu);
    }, [showMenu]);

    const handlePull = async () => {
        // Placeholder for pull logic (sync handles both, but granular is good)
        await syncChanges();
    };

    const handlePush = async () => {
        await syncChanges();
    };

    const handleRefresh = () => {
        checkStatus();
        if (isRepo) {
            getHistory().then(commits => setHistory(commits || []));
            fetchGitRemotes();
        }
        fetchCloudProjects();
        const token = localStorage.getItem('github_token');
        if (token) fetchRepos(token);
    };

    // VS Code Source Control View
    const renderSourceControl = () => (
        <div style={styles.container}>
            {/* 1. SOURCE CONTROL HEADER */}
            <div style={{
                padding: '8px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#252526',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#BBBBBB',
                letterSpacing: '0.5px',
                position: 'relative' // For menu positioning
            }}>
                <span>SOURCE CONTROL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title={`On branch: ${branch}`}>
                        <i className="fa-solid fa-code-branch" style={{ fontSize: '10px' }}></i>
                        <span>{branch}</span>
                    </div>
                    <div
                        style={{ marginLeft: '8px', cursor: 'pointer', padding: '2px 4px' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <i className="fa-solid fa-ellipsis"></i>
                    </div>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '28px',
                            right: '8px',
                            background: '#252526',
                            border: '1px solid #454545',
                            borderRadius: '3px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            minWidth: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '4px 0'
                        }}>
                            <div style={styles.menuItem} onClick={handleRefresh}>
                                <i className="fa-solid fa-arrows-rotate" style={{ width: '16px' }}></i> Refresh
                            </div>
                            <div style={styles.menuItem} onClick={handlePull}>
                                <i className="fa-solid fa-arrow-down" style={{ width: '16px' }}></i> Pull
                            </div>
                            <div style={styles.menuItem} onClick={handlePush}>
                                <i className="fa-solid fa-arrow-up" style={{ width: '16px' }}></i> Push
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. COMMIT INPUT AREA */}
            <div style={{ padding: '0 16px 16px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder={`Message (Ctrl+Enter to commit)`}
                        style={{
                            background: '#3c3c3c',
                            border: '1px solid #3c3c3c',
                            color: '#cccccc',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            padding: '8px',
                            resize: 'vertical',
                            borderRadius: '2px',
                            outline: '1px solid transparent',
                            minHeight: '80px'
                        }}
                        onFocus={(e) => e.target.style.outline = '1px solid #bc13fe'}
                        onBlur={(e) => e.target.style.outline = '1px solid transparent'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleCommit();
                            }
                        }}
                    />

                    <button
                        onClick={handleCommit}
                        disabled={gitLoading || changes.length === 0 || !commitMessage.trim()}
                        title={
                            changes.length === 0
                                ? 'No changes to commit'
                                : !commitMessage.trim()
                                    ? 'Enter a commit message'
                                    : 'Commit changes (Ctrl+Enter)'
                        }
                        style={{
                            background: (changes.length === 0 || !commitMessage.trim()) ? '#3c3c3c' : '#bc13fe',
                            color: (changes.length === 0 || !commitMessage.trim()) ? '#888888' : '#ffffff',
                            border: 'none',
                            padding: '8px 12px',
                            fontSize: '12px',
                            cursor: (changes.length === 0 || !commitMessage.trim()) ? 'not-allowed' : 'pointer',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 600,
                            width: '100%',
                            transition: 'background 0.2s, color 0.2s'
                        }}
                    >
                        {gitLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                        Commit
                    </button>

                    <button
                        onClick={handleSync}
                        disabled={gitLoading}
                        style={{
                            ...styles.secondaryButton,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        title="Sync Changes (Pull & Push)"
                    >
                        <i className={`fa-solid fa-arrows-rotate ${gitLoading ? 'fa-spin' : ''}`}></i>
                        Sync Changes
                    </button>
                </div>
            </div>

            {/* 4. CHANGES LIST */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Collapsible Header */}
                <div style={{
                    padding: '4px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: changesExpanded ? 'rgba(255,255,255,0.04)' : 'transparent'
                }} onClick={() => setChangesExpanded(!changesExpanded)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#BBBBBB' }}>
                        <i className={`fa-solid fa-chevron-${changesExpanded ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
                        CHANGES
                    </div>
                    <span style={{
                        background: '#444444',
                        color: '#ffffff',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        minWidth: '18px',
                        textAlign: 'center'
                    }}>{changes.length}</span>
                </div>

                {changesExpanded && (
                    <div style={{ marginTop: '0px' }}>
                        {changes.length === 0 ? (
                            <div style={{ padding: '8px 24px', fontSize: '12px', color: '#777', fontStyle: 'italic' }}>
                                No changes detected.
                            </div>
                        ) : (
                            changes.map((change: any, i: number) => (
                                <div
                                    key={i}
                                    className="git-change-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 24px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: '#cccccc'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span style={{
                                        color: getStatusColor(change.status),
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        width: '12px',
                                        textAlign: 'center'
                                    }}>
                                        {getStatusLetter(change.status)}
                                    </span>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                        {change.file}
                                    </span>
                                    <div className="hover-actions" style={{ display: 'none', gap: '8px' }}>
                                        <i className="fa-solid fa-arrow-rotate-left" title="Discard" style={{ fontSize: '12px', color: '#ccc' }}></i>
                                        <i className="fa-solid fa-plus" title="Stage" style={{ fontSize: '12px', color: '#ccc' }}></i>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 5. HISTORY SECTION */}
                <div style={{ marginTop: '8px' }}>
                    <div style={{
                        padding: '4px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#BBBBBB',
                        cursor: 'pointer',
                        background: commitsExpanded ? 'rgba(255,255,255,0.04)' : 'transparent'
                    }} onClick={() => setCommitsExpanded(!commitsExpanded)}>
                        <i className={`fa-solid fa-chevron-${commitsExpanded ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
                        COMMITS
                    </div>

                    {commitsExpanded && (
                        <div style={{ marginTop: '0px', paddingLeft: '0px' }}>
                            {history.map((commit: any, i) => (
                                <div key={i} style={{
                                    padding: '8px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    borderLeft: '3px solid transparent',
                                    cursor: 'default'
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e'; e.currentTarget.style.borderLeftColor = '#bc13fe'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                                >
                                    <div style={{ fontSize: '13px', color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                                        {commit.message}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: 'monospace' }}>{commit.hash.substring(0, 7)}</span>
                                        <span>{i === 0 ? 'Latest' : 'Older'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );

    // Remote Repositories View
    const renderRemotes = () => (
        <div style={styles.container}>
            {/* 1. GIT REMOTES SECTION */}
            {isRepo && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #333' }}>
                    <div style={{ ...styles.sectionTitle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>GIT REMOTES (LOCAL CONFIG)</span>
                        <i
                            className={`fa-solid fa-arrows-rotate ${loadingGitRemotes ? 'fa-spin' : ''}`}
                            style={{ cursor: 'pointer', color: '#888' }}
                            onClick={fetchGitRemotes}
                        ></i>
                    </div>

                    {loadingGitRemotes ? (
                        <div style={{ padding: '10px 0', textAlign: 'center', color: '#858585' }}>
                            <i className="fa-solid fa-spinner fa-spin"></i> Loading...
                        </div>
                    ) : gitRemotes.length === 0 ? (
                        <div style={{ padding: '10px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                            No Git remotes configured.
                        </div>
                    ) : (
                        <div style={styles.repoList}>
                            {gitRemotes.map((remote: any) => (
                                <div key={remote.name} style={{ ...styles.repoItem, background: 'rgba(0, 242, 255, 0.05)' }}>
                                    <div style={styles.repoHeader}>
                                        <div style={styles.repoName}>
                                            <i className="fa-solid fa-code-branch" style={{ marginRight: '8px', color: '#00f2ff' }}></i>
                                            {remote.name}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {remote.url}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. CLOUD PROJECTS SECTION (MongoDB) */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #333' }}>
                <div style={{ ...styles.sectionTitle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>CLOUD PROJECTS (MONGODB)</span>
                    <i
                        className={`fa-solid fa-arrows-rotate ${loadingCloud ? 'fa-spin' : ''}`}
                        style={{ cursor: 'pointer', color: '#888' }}
                        onClick={fetchCloudProjects}
                    ></i>
                </div>

                {loadingCloud ? (
                    <div style={{ padding: '10px 0', textAlign: 'center', color: '#858585' }}>
                        <i className="fa-solid fa-spinner fa-spin"></i> Loading...
                    </div>
                ) : cloudProjects.length === 0 ? (
                    <div style={{ padding: '10px 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        No cloud projects found. Save code to sync here.
                    </div>
                ) : (
                    <div style={styles.repoList}>
                        {cloudProjects.map((project: any) => (
                            <div
                                key={project._id}
                                style={{ ...styles.repoItem, background: 'rgba(188, 19, 254, 0.02)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(188, 19, 254, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(188, 19, 254, 0.02)'}
                            >
                                <div style={styles.repoHeader}>
                                    <div style={styles.repoName}>
                                        <i className="fa-solid fa-cloud" style={{ marginRight: '8px', color: '#bc13fe', width: '16px', textAlign: 'center' }}></i>
                                        {project.projectName}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#888' }}>
                                        {project.files?.length || 0} files
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                    Language: {project.language || 'Javascript'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. GITHUB REPOSITORIES SECTION */}
            <div style={{ padding: '12px 20px' }}>
                <div style={{ ...styles.sectionTitle, marginBottom: '12px' }}>
                    GITHUB REPOSITORIES
                </div>

                {!isConnected ? (
                    <div style={styles.connectPrompt}>
                        <p style={{ marginBottom: '16px', color: '#858585' }}>
                            Connect your GitHub account to clone repositories
                        </p>
                        <button onClick={handleLogin} style={styles.primaryButton}>
                            <i className="fa-brands fa-github" style={{ marginRight: '8px' }}></i>
                            Sign in with GitHub
                        </button>
                    </div>
                ) : loadingRepos ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#858585' }}>
                        <i className="fa-solid fa-spinner fa-spin"></i> Loading repositories...
                    </div>
                ) : (
                    <div style={styles.repoList}>
                        {repositories.map((repo: any) => (
                            <div
                                key={repo.id}
                                style={styles.repoItem}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={styles.repoHeader}>
                                    <div style={styles.repoName}>
                                        <i className="fa-brands fa-github" style={{ marginRight: '8px', width: '16px', textAlign: 'center' }}></i>
                                        {repo.name}
                                    </div>
                                    <button
                                        onClick={() => handleClone(repo.url, repo.id)}
                                        disabled={cloningRepo !== null}
                                        style={{
                                            ...styles.cloneButton,
                                            opacity: cloningRepo && cloningRepo !== repo.id ? 0.5 : 1
                                        }}
                                    >
                                        {cloningRepo === repo.id ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-download" style={{ marginRight: '4px' }}></i>
                                                Clone
                                            </>
                                        )}
                                    </button>
                                </div>
                                {repo.description && (
                                    <div style={styles.repoDescription}>{repo.description}</div>
                                )}
                                <div style={styles.repoMeta}>
                                    <span>
                                        <i className="fa-solid fa-star" style={{ color: '#fbbf24', marginRight: '4px' }}></i>
                                        {repo.stars}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={styles.wrapper}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>SOURCE CONTROL</div>
                <div style={styles.headerActions}>
                    {isRepo && (
                        <>
                            <i className="fa-solid fa-code-branch" style={{ marginRight: '6px', fontSize: '11px' }}></i>
                            <span style={{ fontSize: '11px' }}>{branch}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs (only show if repo is open) */}
            {isRepo && (
                <div style={styles.tabs}>
                    <div
                        onClick={() => setViewMode('source-control')}
                        style={{
                            ...styles.tab,
                            ...(viewMode === 'source-control' ? styles.tabActive : {})
                        }}
                    >
                        SOURCE CONTROL
                    </div>
                    <div
                        onClick={() => setViewMode('remotes')}
                        style={{
                            ...styles.tab,
                            ...(viewMode === 'remotes' ? styles.tabActive : {})
                        }}
                    >
                        REMOTES
                    </div>
                </div>
            )}

            {/* Content */}
            {isRepo && viewMode === 'source-control'
                ? renderSourceControl()
                : renderRemotes()
            }
        </div>
    );
};

// VS Code Styled Component Styles
const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#252526',
        color: '#cccccc',
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '13px'
    },
    header: {
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #2b2b2b'
    },
    headerTitle: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#bbbbbb',
        textTransform: 'uppercase'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#cccccc'
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid #2b2b2b',
        background: '#252526'
    },
    tab: {
        padding: '10px 20px',
        fontSize: '11px',
        cursor: 'pointer',
        color: '#858585',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
    },
    tabActive: {
        color: '#ffffff',
        borderBottomColor: '#bc13fe'
    },
    container: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
    },
    commitSection: {
        padding: '12px 20px',
        borderBottom: '1px solid #2b2b2b'
    },
    commitInput: {
        width: '100%',
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        fontSize: '13px',
        padding: '8px',
        marginBottom: '8px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
    },
    commitActions: {
        display: 'flex',
        gap: '4px'
    },
    commitButton: {
        flex: 1,
        background: '#bc13fe',
        border: 'none',
        borderRadius: '2px',
        color: '#ffffff',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    syncButton: {
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        cursor: 'pointer'
    },
    moreButton: {
        background: '#3c3c3c',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        cursor: 'pointer'
    },
    section: {
        marginTop: '1px'
    },
    sectionHeader: {
        padding: '6px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#bbbbbb',
        textTransform: 'uppercase'
    },
    chevron: {
        fontSize: '10px',
        color: '#858585'
    },
    badge: {
        background: '#444444',
        color: '#ffffff',
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '11px',
        minWidth: '20px',
        textAlign: 'center'
    },
    fileList: {
        paddingLeft: '20px'
    },
    fileItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 20px 4px 32px',
        cursor: 'pointer',
        transition: 'background 0.1s'
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        overflow: 'hidden'
    },
    fileName: {
        fontSize: '13px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    statusBadge: {
        fontSize: '11px',
        fontWeight: 700,
        marginLeft: '8px'
    },
    emptyMessage: {
        padding: '12px 20px 12px 32px',
        fontSize: '12px',
        color: '#858585',
        fontStyle: 'italic'
    },
    commitList: {
        paddingLeft: '20px'
    },
    commitItem: {
        padding: '8px 20px 8px 32px',
        borderLeft: '2px solid transparent',
        cursor: 'pointer'
    },
    commitMessage: {
        fontSize: '13px',
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    commitMeta: {
        fontSize: '11px',
        color: '#858585'
    },
    connectPrompt: {
        padding: '40px 20px',
        textAlign: 'center'
    },
    primaryButton: {
        background: '#bc13fe',
        border: 'none',
        borderRadius: '2px',
        color: '#ffffff',
        padding: '8px 16px',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center'
    },
    repoList: {
        padding: '0'
    },
    repoItem: {
        padding: '8px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        borderBottom: '1px solid #252526',
        cursor: 'pointer',
        transition: 'background 0.1s',
        position: 'relative' as const
    },
    repoHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    repoName: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#cccccc',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1
    },
    cloneButton: {
        background: '#bc13fe',
        border: 'none',
        borderRadius: '2px',
        color: '#ffffff',
        padding: '2px 8px',
        fontSize: '11px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        marginLeft: '10px'
    },
    repoDescription: {
        fontSize: '11px',
        color: '#858585',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: '1.4'
    },
    repoMeta: {
        display: 'flex',
        gap: '12px',
        fontSize: '11px',
        color: '#858585',
        marginTop: '2px'
    },
    menuItem: {
        padding: '6px 16px',
        fontSize: '13px',
        color: '#cccccc',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.1s'
    },
    secondaryButton: {
        background: 'transparent',
        border: '1px solid #3c3c3c',
        borderRadius: '2px',
        color: '#cccccc',
        padding: '6px 12px',
        fontSize: '11px',
        cursor: 'pointer',
        marginTop: '8px'
    }
};

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Network.css";

import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween, 
    Container, Input, Grid, StatusIndicator, Button, Tabs
} from "@cloudscape-design/components";

export default function Network() {
    const navigate = useNavigate();

    const [tabId, setTabId] = useState("following");
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    const [followingUsers, setFollowingUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);

    const [followBusy, setFollowBusy] = useState({});

    const [followCounts, setFollowCounts] = useState({
        followers: 0,
        following: 0,
    });
    const [followCountsLoading, setFollowCountsLoading] = useState(true);

    const safeText = (text) => (String(text || "").trim() ? String(text) : "");
    const makeLocation = (u) => [u.city, u.state, u.country].filter(Boolean).join(", ");
    const avatarLetter = (username) => (username?.[0]?.toUpperCase() || "?");

    const ensureSession = async () => {
        const sessionRes = await fetch("/api/session", { credentials: "include" });
        const sessionJson = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok || sessionJson.status !== "success") {
            navigate("/login");
            return false;
        }
        return true;
    };

    const loadMyFollowCounts = async () => {
        setFollowCountsLoading(true);
        try {
            // get current session (and username)
            const sessionRes = await fetch("/api/session", { credentials: "include" });
            const sessionJson = await sessionRes.json().catch(() => ({}));

            if (!sessionRes.ok || sessionJson.status !== "success") {
                navigate("/login");
                return;
            }

            const me = String(sessionJson.username || "").trim();
            if (!me) return;

            const followRes = await fetch(`/api/follow/${encodeURIComponent(me)}`, {
                method: "GET",
                credentials: "include",
            });

            const followJson = await followRes.json().catch(() => ({}));

            if (followRes.ok && followJson.status === "success") {
                setFollowCounts({
                    followers: Number(followJson.meta?.counts?.followers || 0),
                    following: Number(followJson.meta?.counts?.following || 0),
                });
            }
        } catch (err) {
            console.error("Follow counts load error:", err);
        } finally {
            setFollowCountsLoading(false);
        }
    };


    const loadFollowing = async (query) => {
        setLoading(true);
        try {
            const ok = await ensureSession();
            if (!ok) return;

            const url = query ? `/api/network?q=${encodeURIComponent(query)}` : "/api/network";
            const res = await fetch(url, { credentials: "include" });
            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.status !== "success") {
                setFollowingUsers([]);
                return;
            }

            setFollowingUsers(json.users || []);
            setPendingCount(Number(json.pendingCount || 0));
        } catch (err) {
            console.error("Network load error:", err);
            setFollowingUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPending = async (query) => {
        setLoading(true);
        try {
            const ok = await ensureSession();
            if (!ok) return;

            const url = query
                ? `/api/network/pending?q=${encodeURIComponent(query)}`
                : "/api/network/pending";

            const res = await fetch(url, { credentials: "include" });
            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.status !== "success") {
                setPendingUsers([]);
                return;
            }

            setPendingUsers(json.users || []);
            setPendingCount(Number(json.pendingCount || 0));
        } catch (err) {
            console.error("Pending load error:", err);
            setPendingUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshPendingCount = async () => {
        try {
            const ok = await ensureSession();
            if (!ok) return;

            const res = await fetch("/api/network/pending", { credentials: "include" });
            const json = await res.json().catch(() => ({}));

            if (res.ok && json.status === "success") {
                setPendingCount(Number(json.pendingCount || 0));
            }
        } catch (err) {
            console.error("Pending count refresh error:", err);
        }
    };

    const loadActiveTab = async (query) => {
        if (tabId === "pending") {
            await loadPending(query);
        } else {
            await loadFollowing(query);
        }
    };

    const followBack = async (username) => {
        if (!username) return;

        setFollowBusy((m) => ({ ...m, [username]: true }));
        try {
            const res = await fetch(`/api/follow/${encodeURIComponent(username)}`, {
                method: "POST",
                credentials: "include"
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") return;

            await loadFollowing(q);
            await loadPending(q);
            await refreshPendingCount();
        } catch (err) {
            console.error("Follow back error:", err);
        } finally {
            setFollowBusy((m) => ({ ...m, [username]: false }));
        }
    };

    const unfollow = async (username) => {
        if (!username) return;

        setFollowBusy((m) => ({ ...m, [username]: true }));
        try {
            const res = await fetch(`/api/follow/${encodeURIComponent(username)}`, {
                method: "DELETE",
                credentials: "include"
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") return;

            await loadFollowing(q);
            await refreshPendingCount();
        } catch (err) {
            console.error("Unfollow error:", err);
        } finally {
            setFollowBusy((m) => ({ ...m, [username]: false }));
        }
    };

    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            await loadFollowing("");
            await refreshPendingCount();

            if (!cancelled) {
                await loadMyFollowCounts();
            }
        };

        boot();

        return () => {
                cancelled = true;
        };
    }, []);

    useEffect(() => {
        // When switching tabs, load that tab’s list (count is already kept refreshed)
        loadActiveTab(q);
    }, [tabId]);


    const activeUsers = useMemo(() => {
        return tabId === "pending" ? pendingUsers : followingUsers;
    }, [tabId, pendingUsers, followingUsers]);

    const emptyText =
        tabId === "pending"
            ? "No pending requests right now."
            : "You aren’t following anyone yet (or they’re private and not connected). Go to the Feed and follow some people.";

    const renderCards = (list, mode) => {
        return (
            <div className="network-grid">
                {list.map((u) => {
                    const location = makeLocation(u) || "—";
                    const industry = safeText(u.industry_name) || "—";
                    const title = safeText(u.title) || "—";
                    const bio = safeText(u.bio) || "—";
                    const isPrivate = u.privacy === "private";

                    const canClickPortfolio = mode === "following";

                    return (
                        <Container key={u.user_id} className="network-card">
                            <div
                                className="network-cardClickable"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (!canClickPortfolio) return;
                                    navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (!canClickPortfolio) return;
                                        navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                    }
                                }}
                            >
                                <div className="network-top">
                                    <div className="network-avatar">{avatarLetter(u.username)}</div>

                                    <div className="network-identity">
                                        <Box fontWeight="bold" fontSize="heading-s">
                                            @{u.username}
                                        </Box>

                                        {mode === "pending" ? (
                                            <StatusIndicator type="info">Pending</StatusIndicator>
                                        ) : (
                                            <StatusIndicator type="success">Following</StatusIndicator>
                                        )}

                                        <StatusIndicator type={isPrivate ? "error" : "success"}>
                                            {isPrivate ? "Private" : "Public"}
                                        </StatusIndicator>
                                    </div>
                                </div>

                                {mode === "pending" && isPrivate ? (
                                    <>
                                        <Box margin={{ top: "s" }} color="text-body-secondary">
                                            This user is private. Follow back to connect and view their portfolio.
                                        </Box>

                                        <Box margin={{ top: "s" }}>
                                            <Button
                                                variant="primary"
                                                loading={!!followBusy[u.username]}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    followBack(u.username);
                                                }}
                                            >
                                                Follow back
                                            </Button>
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <div className="network-tags">
                                            <span className="network-tag">
                                                <span className="network-tagLabel">Industry</span>
                                                <span className="network-tagValue">{industry}</span>
                                            </span>

                                            <span className="network-tag">
                                                <span className="network-tagLabel">Title</span>
                                                <span className="network-tagValue">{title}</span>
                                            </span>

                                            <span className="network-tag">
                                                <span className="network-tagLabel">Location</span>
                                                <span className="network-tagValue">{location}</span>
                                            </span>
                                        </div>

                                        <Box margin={{ top: "s" }} color="text-body-secondary">
                                            {bio.length > 140 ? `${bio.slice(0, 140)}...` : bio}
                                        </Box>

                                        <div className="network-stats">
                                            <div className="network-stat">
                                                <div className="network-statValue">{u.projects ?? 0}</div>
                                                <div className="network-statLabel">Projects</div>
                                            </div>

                                            <div className="network-stat">
                                                <div className="network-statValue">{u.experiences ?? 0}</div>
                                                <div className="network-statLabel">Experiences</div>
                                            </div>

                                            <div className="network-stat">
                                                <div className="network-statValue">{u.affiliations ?? 0}</div>
                                                <div className="network-statLabel">Affiliations</div>
                                            </div>

                                            <div className="network-stat">
                                                <div className="network-statValue">{u.hardSkills ?? 0}</div>
                                                <div className="network-statLabel">Hard Skills</div>
                                            </div>

                                            <div className="network-stat">
                                                <div className="network-statValue">{u.softSkills ?? 0}</div>
                                                <div className="network-statLabel">Soft Skills</div>
                                            </div>
                                        </div>

                                        <Box margin={{ top: "s" }}>
                                            {mode === "pending" ? (
                                                <Button
                                                    variant="primary"
                                                    loading={!!followBusy[u.username]}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        followBack(u.username);
                                                    }}
                                                >
                                                    Follow back
                                                </Button>
                                            ) : (
                                                <div className="network-actionsRow">
                                                    <Button
                                                        variant="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                                        }}
                                                    >
                                                        View portfolio
                                                    </Button>

                                                    <Button
                                                            className="network-unfollowBtn"
                                                            loading={!!followBusy[u.username]}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                unfollow(u.username);
                                                            }}
                                                        >
                                                            Unfollow
                                                    </Button>
                                                </div>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </div>
                        </Container>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <div className="app-under-navbar">
                <AppLayout
                    navigationHide
                    toolsHide
                    content={
                        <div className="network-page">
                            <ContentLayout
                                // header={
                                //     <Header variant="h1" description="Manage your network and pending connections."> Your Network </Header>
                                // }
                                header={
                                    <Header 
                                        variant="h1" 
                                        description="Manage your network and pending connections."
                                        actions={
                                            <SpaceBetween direction="horizontal" size="xs">
                                                <Button variant="link" onClick={() => navigate("/feed")}>
                                                    ← Back to Feed
                                                </Button>
                                            </SpaceBetween>
                                        }
                                    > 
                                        Your Network 
                                    </Header>
                                }
                            >
                                <SpaceBetween size="l">
                                    <Container>
                                        <SpaceBetween size="s">
                                            <Tabs
                                                activeTabId={tabId}
                                                onChange={({ detail }) => {
                                                    setQ("");
                                                    setTabId(detail.activeTabId);
                                                }}
                                                tabs={[
                                                    {
                                                        id: "following",
                                                        label: "Following",
                                                        content: <div className="network-tabsEmpty" />
                                                    },
                                                    {
                                                        id: "pending",
                                                        label: `Pending (${pendingCount})`,
                                                        content: <div className="network-tabsEmpty" />
                                                    }
                                                ]}
                                            />

                                            <Box fontWeight="bold">Search</Box>
                                            <Input
                                                value={q}
                                                placeholder="Search by username, title, industry, or location..."
                                                onChange={({ detail }) => setQ(detail.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") loadActiveTab(q);
                                                }}
                                            />
                                            <SpaceBetween direction="horizontal" size="s">
                                                <Button onClick={() => loadActiveTab(q)} loading={loading}> Search </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setQ("");
                                                        loadActiveTab("");
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                                {/* <Button variant="link" onClick={() => navigate("/feed")}>
                                                    ← Back to Feed
                                                </Button> */}
                                            </SpaceBetween>
                                        </SpaceBetween>
                                    </Container>

                                    <div className="dash-followCounts">
                                        <span className="dash-followPill">
                                            <span className="dash-followNum">
                                                {followCountsLoading ? "—" : followCounts.followers}
                                            </span>
                                            <span className="dash-followLabel">Followers</span>
                                        </span>

                                        <span className="dash-followPill">
                                            <span className="dash-followNum">
                                                {followCountsLoading ? "—" : followCounts.following}
                                            </span>
                                            <span className="dash-followLabel">Following</span>
                                        </span>
                                    </div>

                                    {loading ? (
                                        <Box color="text-body-secondary">Loading...</Box>
                                    ) : activeUsers.length === 0 ? (
                                        <Box color="text-body-secondary">{emptyText}</Box>
                                    ) : (
                                        renderCards(activeUsers, tabId)
                                    )}
                                </SpaceBetween>
                            </ContentLayout>
                        </div>
                    }
                />
            </div>
        </>
    );
}
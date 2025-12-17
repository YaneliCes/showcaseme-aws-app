import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween,
    Container, Input, Grid, StatusIndicator, Button,
} from "@cloudscape-design/components";
import Navbar from "../components/Navbar";
import "./Feed.css";

export default function Feed() {
    const navigate = useNavigate();

    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    const [followBusy, setFollowBusy] = useState({});

    const safeText = (text) => (String(text || "").trim() ? String(text) : "");

    const makeLocation = (u) => [u.city, u.state, u.country].filter(Boolean).join(", ");

    const avatarLetter = (username) => (username?.[0]?.toUpperCase() || "?");

    const load = async (query) => {
        setLoading(true);

        try {
            const url = query ? `/api/feed?q=${encodeURIComponent(query)}` : "/api/feed";
            const res = await fetch(url, { credentials: "include" });
            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.status !== "success") {
                setUsers([]);
                return;
            }

            setUsers(json.users || []);
        } catch (err) {
            console.error("Feed load error:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async (username, isFollowing) => {
        if (!username) return;

        setFollowBusy((m) => ({ ...m, [username]: true }));

        try {
            const res = await fetch(`/api/follow/${encodeURIComponent(username)}`, {
                method: isFollowing ? "DELETE" : "POST",
                credentials: "include",
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") return;

            await load(q);
        } catch (e) {
            console.error("toggleFollow error:", e);
        } finally {
            setFollowBusy((m) => ({ ...m, [username]: false }));
        }
    };

    useEffect(() => {
        // Apply saved theme (keeps dark mode consistent across pages)
        const saved = localStorage.getItem("cs-color-mode");
        const next = saved === "dark" ? Mode.Dark : Mode.Light;
        applyMode(next);

        // Check session, then load feed
        const boot = async () => {
            try {
                const sessionRes = await fetch("/api/session", {
                    method: "GET",
                    credentials: "include",
                });

                const sessionJson = await sessionRes.json().catch(() => ({}));
                if (!sessionRes.ok || sessionJson.status !== "success") {
                    navigate("/login");
                    return;
                }

                await load("");
            } catch (err) {
                console.error("Feed session check error:", err);
                navigate("/login");
            }
        };

        boot();
    }, [navigate]);

    const filtered = useMemo(() => users, [users]);

    return (
        <>
            <Navbar />
            <div className="app-under-navbar">
                <AppLayout
                    navigationHide
                    toolsHide
                    content={
                        <div className="feed-page">
                            <ContentLayout
                                header={
                                    <Header variant="h1" description="Explore portfolios. Public profiles show full previews. Private profiles require mutual connection to view.">
                                        Portfolio Feed
                                    </Header>
                                }
                            >
                                <SpaceBetween size="l">
                                    <Container>
                                        <SpaceBetween size="s">
                                            <Box fontWeight="bold">Search</Box>
                                            <Input
                                                value={q}
                                                placeholder="Search by username, title, industry, or location..."
                                                onChange={({ detail }) => setQ(detail.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") load(q);
                                                }}
                                            />
                                            <SpaceBetween direction="horizontal" size="s">
                                                <Button onClick={() => load(q)} loading={loading}>
                                                    Search
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setQ("");
                                                        load("");
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </SpaceBetween>
                                        </SpaceBetween>
                                    </Container>

                                    {loading ? (
                                        <Box color="text-body-secondary">Loading feed...</Box>
                                    ) : filtered.length === 0 ? (
                                        <Box color="text-body-secondary">No portfolios found.</Box>
                                    ) : (
                                        <Grid
                                            gridDefinition={[
                                                { colspan: { default: 12, s: 6, l: 4 } },
                                                { colspan: { default: 12, s: 6, l: 4 } },
                                                { colspan: { default: 12, s: 6, l: 4 } },
                                            ]}
                                        >
                                            {filtered.map((u) => {
                                                const location = makeLocation(u) || "—";
                                                const industry = safeText(u.industry_name) || "—";
                                                const title = safeText(u.title) || "—";
                                                const bio = safeText(u.bio) || "—";

                                                const isPrivate = u.privacy === "private";

                                                // Always show full preview for public profiles
                                                // Private profiles only show full preview if backend says you can view (e.g., mutual connection)
                                                const canView = (u.privacy === "public") || !!u.canViewPortfolio;

                                                const isFollowing = !!u.following;
                                                const isConnected = !!u.connection;
                                                const followedBy = !!u.followedBy;

                                                const goToPortfolio = () => {
                                                    if (!canView) return;
                                                    navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                                };

                                                return (
                                                    <Container key={u.user_id} className="feed-card">
                                                        <div
                                                            className="feed-cardClickable"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={goToPortfolio}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") goToPortfolio();
                                                            }}
                                                        >
                                                            <div className="feed-top">
                                                                <div className="feed-avatar">
                                                                    {avatarLetter(u.username)}
                                                                </div>

                                                                <div className="feed-identity">
                                                                    <Box fontWeight="bold" fontSize="heading-s">
                                                                        @{u.username}
                                                                    </Box>
                                                                    <StatusIndicator
                                                                        type={isPrivate ? "error" : "success"}
                                                                    >
                                                                        {isPrivate ? "Private" : "Public"}
                                                                    </StatusIndicator>
                                                                </div>
                                                            </div>

                                                            {canView ? (
                                                                <>
                                                                    <div className="feed-tags">
                                                                        <span className="feed-tag">
                                                                            <span className="feed-tagLabel">Industry</span>
                                                                            <span className="feed-tagValue">{industry}</span>
                                                                        </span>

                                                                        <span className="feed-tag">
                                                                            <span className="feed-tagLabel">Title</span>
                                                                            <span className="feed-tagValue">{title}</span>
                                                                        </span>

                                                                        <span className="feed-tag">
                                                                            <span className="feed-tagLabel">Location</span>
                                                                            <span className="feed-tagValue">{location}</span>
                                                                        </span>
                                                                    </div>

                                                                    <Box margin={{ top: "s" }} color="text-body-secondary">
                                                                        {bio.length > 140 ? `${bio.slice(0, 140)}...` : bio}
                                                                    </Box>

                                                                    <div className="feed-stats">
                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">{u.projects ?? 0}</div>
                                                                            <div className="feed-statLabel">Projects</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">{u.experiences ?? 0}</div>
                                                                            <div className="feed-statLabel">Experience</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">{u.affiliations ?? 0}</div>
                                                                            <div className="feed-statLabel">Affiliations</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">{u.hardSkills ?? 0}</div>
                                                                            <div className="feed-statLabel">Hard</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">{u.softSkills ?? 0}</div>
                                                                            <div className="feed-statLabel">Soft</div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="feed-tags">
                                                                        <span className="feed-tag">
                                                                            <span className="feed-tagLabel">Visibility</span>
                                                                            <span className="feed-tagValue">Private</span>
                                                                        </span>

                                                                        <span className="feed-tag">
                                                                            <span className="feed-tagLabel">Access</span>
                                                                            <span className="feed-tagValue">
                                                                                Follow to request
                                                                            </span>
                                                                        </span>
                                                                    </div>

                                                                    <Box margin={{ top: "s" }} color="text-body-secondary">
                                                                        This portfolio is private. Follow to request access.
                                                                    </Box>

                                                                    <div className="feed-stats">
                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">—</div>
                                                                            <div className="feed-statLabel">Projects</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">—</div>
                                                                            <div className="feed-statLabel">Experience</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">—</div>
                                                                            <div className="feed-statLabel">Affiliations</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">—</div>
                                                                            <div className="feed-statLabel">Hard</div>
                                                                        </div>

                                                                        <div className="feed-stat">
                                                                            <div className="feed-statValue">—</div>
                                                                            <div className="feed-statLabel">Soft</div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            <Box margin={{ top: "s" }}>
                                                                {canView ? (
                                                                    <Button
                                                                        variant="primary"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                                                        }}
                                                                    >
                                                                        View portfolio
                                                                    </Button>
                                                                ) : (
                                                                    <SpaceBetween direction="horizontal" size="xs">
                                                                        <Button
                                                                            variant={isFollowing ? "normal" : "primary"}
                                                                            loading={!!followBusy[u.username]}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleFollow(u.username, isFollowing);
                                                                            }}
                                                                        >
                                                                            {isFollowing ? "Following" : "Follow"}
                                                                        </Button>

                                                                        {isConnected ? (
                                                                            <StatusIndicator type="success">Connected</StatusIndicator>
                                                                        ) : followedBy ? (
                                                                            <StatusIndicator type="info">Follows you</StatusIndicator>
                                                                        ) : null}
                                                                    </SpaceBetween>
                                                                )}
                                                            </Box>
                                                        </div>
                                                    </Container>
                                                );
                                            })}
                                        </Grid>
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
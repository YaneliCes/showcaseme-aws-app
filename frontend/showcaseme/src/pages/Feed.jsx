import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import "./Feed.css";
import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween,
    Container, Input, Grid, StatusIndicator, Button
} from "@cloudscape-design/components";
import { useNavigate } from "react-router-dom";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

export default function Feed() {
    const navigate = useNavigate();

    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

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

    const safeText = (text) => (String(text || "").trim() ? String(text) : "");

    const makeLocation = (u) => {
        return [u.city, u.state, u.country].filter(Boolean).join(", ");
    };

    const avatarLetter = (username) => (username?.[0]?.toUpperCase() || "?");

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
                                    <Header variant="h1" description="Explore public portfolios. Click one to view the full page.">
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
                                                <Button onClick={() => load(q)} loading={loading}> Search </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setQ("");
                                                        load(""); }}
                                                >
                                                    Clear
                                                </Button>
                                            </SpaceBetween>
                                        </SpaceBetween>
                                    </Container>

                                    {loading ? (
                                        <Box color="text-body-secondary">Loading feed...</Box>
                                    ) : filtered.length === 0 ? (
                                        <Box color="text-body-secondary">No public portfolios found.</Box>
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

                                                return (
                                                    <Container key={u.user_id} className="feed-card">
                                                        <div
                                                            className="feed-cardClickable"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() =>
                                                                navigate(`/portfolio/${encodeURIComponent(u.username)}`)
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    navigate(
                                                                        `/portfolio/${encodeURIComponent(u.username)}`
                                                                    );
                                                                }
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
                                                                    <StatusIndicator type="success">Public</StatusIndicator>
                                                                </div>
                                                            </div>

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
                                                                    <div className="feed-statLabel">Experiences</div>
                                                                </div>

                                                                <div className="feed-stat">
                                                                    <div className="feed-statValue">{u.affiliations ?? 0}</div>
                                                                    <div className="feed-statLabel">Affiliations</div>
                                                                </div>

                                                                <div className="feed-stat">
                                                                    <div className="feed-statValue">{u.hardSkills ?? 0}</div>
                                                                    <div className="feed-statLabel">Hard Skills</div>
                                                                </div>

                                                                <div className="feed-stat">
                                                                    <div className="feed-statValue">{u.softSkills ?? 0}</div>
                                                                    <div className="feed-statLabel">Soft Skills</div>
                                                                </div>
                                                            </div>

                                                            <Box margin={{ top: "s" }}>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/portfolio/${encodeURIComponent(u.username)}`);
                                                                    }}
                                                                >
                                                                    View portfolio
                                                                </Button>
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
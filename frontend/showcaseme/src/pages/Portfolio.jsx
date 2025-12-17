import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Portfolio.css";
import Navbar from "../components/Navbar";
import "@cloudscape-design/global-styles/index.css";
import {
    AppLayout, BreadcrumbGroup, ContentLayout, Header, Box,
    SpaceBetween, Container, Grid, Tabs, Badge, StatusIndicator, Link, Button
} from "@cloudscape-design/components";

export default function Portfolio() {
    const navigate = useNavigate();
    const { username: routeUsername } = useParams();

    const [loading, setLoading] = useState(true);
    const [viewer, setViewer] = useState(null);

    const [notFound, setNotFound] = useState(false);
    const [privateBlocked, setPrivateBlocked] = useState(false);

    const [profile, setProfile] = useState({
        username: "User",
        bio: "",
        industryName: "",
        privacy: "public",
        tier: "free",
        resume_url: "",
        title: "",
        city: "",
        state: "",
        country: ""
    });

    const [projects, setProjects] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [affiliations, setAffiliations] = useState([]);
    const [education, setEducation] = useState([]);

    const [hardSkills, setHardSkills] = useState([]);
    const [softSkills, setSoftSkills] = useState([]);

    const [followLoading, setFollowLoading] = useState(false);
    const [followMeta, setFollowMeta] = useState({
        following: false,
        followedBy: false,
        connection: false,
        counts: { followers: 0, following: 0 }
    });

    const safeHost = (url) => {
        try {
            if (!url) return "";
            const u = url.startsWith("http") ? url : `https://${url}`;
            return new URL(u).hostname;
        } catch {
            return "";
        }
    };

    const toAbsoluteUrl = (u) => {
        if (!u) return "";
        if (u.startsWith("http://") || u.startsWith("https://")) return u;
        return `${window.location.origin}${u}`;
    };

    const renderDetails = (details) => {
        const raw = String(details || "").trim();
        if (!raw) return null;

        // Split into lines, and treat lines that start with "-", "•", "*" as bullet items. If there are multiple lines, show a list.
        const lines = raw
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);

        const hasMultipleLines = lines.length > 1;

        const items = lines.map((l) => l.replace(/^[-•*]\s*/, ""));

        if (hasMultipleLines) {
            return (
                <ul className="profile-detailsList">
                    {items.map((t, idx) => (
                        <li key={idx} className="profile-detailsItem">
                            {t}
                        </li>
                    ))}
                </ul>
            );
        }

        // single-line details: render as a subtle bullet line
        return (
            <div className="profile-detailsOneLine">
                <span className="profile-detailsDot">•</span>
                <span className="profile-detailsText">{items[0]}</span>
            </div>
        );
    };

    const avatarLetter = useMemo(() => {
        const u = profile.username || "U";
        return u[0]?.toUpperCase() || "?";
    }, [profile.username]);

    const location = useMemo(() => {
        return [profile.city, profile.state, profile.country]
            .filter(Boolean)
            .join(", ");
    }, [profile.city, profile.state, profile.country]);
    
    const goBackToFeed = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate("/feed");
    };

    const loadFollowMeta = async (targetUsername) => {
        if (!targetUsername) return;

        try {
            const res = await fetch(`/api/follow/${encodeURIComponent(targetUsername)}`, {
                credentials: "include",
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json.status === "success") {
                setFollowMeta(json.meta);
            }
        } catch (err) {
            console.error("loadFollowMeta error:", err);
        }
    };

    const isSelf = viewer?.username && profile?.username
        ? viewer.username.toLowerCase() === profile.username.toLowerCase()
        : false;

    const handleFollowToggle = async () => {
        if (!profile?.username || isSelf) return;

        setFollowLoading(true);
        try {
            const method = followMeta.following ? "DELETE" : "POST";

            const res = await fetch(`/api/follow/${encodeURIComponent(profile.username)}`, {
                method,
                credentials: "include",
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                console.error("Follow toggle failed:", json);
                return;
            }

            await loadFollowMeta(profile.username);
        } catch (err) {
            console.error("handleFollowToggle error:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    const loadAll = async () => {
        setLoading(true);
        setNotFound(false);
        setPrivateBlocked(false);

        try {

            // 1) Check session
            const sessionRes = await fetch("/api/session", {
                credentials: "include"
            });
            const sessionJson = await sessionRes.json().catch(() => ({}));

            if (!sessionRes.ok || sessionJson.status !== "success") {
                navigate("/login");
                return;
            }

            const viewerObj = {
                username: sessionJson.username,
                email: sessionJson.email
            };
            setViewer(viewerObj);

            // 2) Determine whose portfolio we’re viewing
            const targetUsername = (routeUsername || viewerObj.username || "").trim();
            if (!targetUsername) {
                setNotFound(true);
                return;
            }

            // 3) Call public portfolio route
            const res = await fetch(
                `/api/public/portfolio/${encodeURIComponent(targetUsername)}`,
                { credentials: "include" }
            );

            if (res.status === 404) {
                setNotFound(true);
                return;
            }
            if (res.status === 403) {
                setPrivateBlocked(true);
                return;
            }

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                setNotFound(true);
                return;
            }

            const p = json.profile || {};
            setProfile({
                username: p.username || targetUsername,
                bio: p.bio || "",
                industryName: p.industry_name || "",
                privacy: p.privacy || "public",
                tier: p.tier || "free",
                resume_url: p.resume_url || "",
                title: p.title || "",
                city: p.city || "",
                state: p.state || "",
                country: p.country || ""
            });

            await loadFollowMeta(p.username || targetUsername);

            const ent = json.entries || {};
            setProjects(ent.projects || []);
            setExperiences(ent.experiences || []);
            setAffiliations(ent.affiliations || []);
            setEducation(ent.education || []);

            const sk = json.skills || {};
            setHardSkills(sk.hard || []);
            setSoftSkills(sk.soft || []);
        } catch (err) {
            console.error("Portfolio load error:", err);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, [routeUsername]);

    if (loading) {
        return <div className="profile-loading">Loading...</div>;
    }

    if (notFound) {
        return (
            <>
                <Navbar />
                <div className="app-under-navbar">
                    <Container>
                        <Header variant="h1">Portfolio not found</Header>
                        <Box color="text-body-secondary">
                            We couldn’t find a public portfolio for <b>@{routeUsername}</b>.
                        </Box>
                    </Container>
                </div>
            </>
        );
    }

    if (privateBlocked) {
        return (
            <>
                <Navbar />
                <div className="app-under-navbar">
                    <Container>
                        <Header variant="h1">This portfolio is private</Header>
                        <Box color="text-body-secondary">
                            <b>@{routeUsername}</b> has set their portfolio to private.
                        </Box>
                    </Container>
                </div>
            </>
        );
    }

    const privacyLabel = profile.privacy === "private" ? "Private" : "Public";

    return (
        <>
            <Navbar />

            <div className="app-under-navbar">
                <AppLayout
                    navigationHide
                    toolsHide
                    breadcrumbs={
                        <BreadcrumbGroup
                            items={[
                                { text: "Feed", href: "/feed" },
                                {
                                    text: `@${profile.username}`,
                                    href: `/portfolio/${encodeURIComponent(profile.username)}`
                                }
                            ]}
                        />
                    }
                    content={
                        <div className="profile-page">
                            <div className="profile-shell">
                                <ContentLayout
                                    header={
                                        <Header
                                            variant="h1"
                                            description="Portfolio view"
                                            actions={
                                                <SpaceBetween direction="horizontal" size="xs">
                                                    <Button variant="link" onClick={goBackToFeed}>
                                                        ← Back to previous page
                                                    </Button>
                                                </SpaceBetween>
                                            }
                                        >
                                            @{profile.username}
                                        </Header>
                                    }
                                >
                                    <SpaceBetween size="l">
                                        {/* HEADER CARD */}
                                        <Container>
                                            <div className="profile-headerCard">
                                                <div className="profile-headerLeft">

                                                     {/* PROFILE */}
                                                    <div className="profile-avatar">
                                                        {avatarLetter}
                                                    </div>

                                                     {/* PROFILE INDUSTRY - LOCATION */}
                                                    <div className="profile-identity">
                                                        <Box
                                                            fontWeight="bold"
                                                            fontSize="heading-m"
                                                        >
                                                            {profile.title?.trim()
                                                                ? profile.title
                                                                : "Portfolio"}
                                                        </Box>

                                                        <Box
                                                            color="text-body-secondary"
                                                            margin={{ top: "xxs" }}
                                                        >
                                                            {profile.industryName?.trim()
                                                                ? profile.industryName
                                                                : "Industry not set"}
                                                            {location ? ` • ${location}` : ""}
                                                        </Box>
                                                        
                                                         {/* PROFILE PRIVACY */}
                                                        <Box margin={{ top: "xs" }}>
                                                            <StatusIndicator
                                                                type={
                                                                    profile.privacy === "private"
                                                                        ? "stopped"
                                                                        : "success"
                                                                }
                                                            >
                                                                {privacyLabel}
                                                            </StatusIndicator>
                                                        </Box>

                                                         {/* PROFILE FOLLOWING/FOLLOWER */}
                                                        <div className="profile-metaRow">
                                                            <div className="profile-stats">
                                                                <div className="profile-statPill">
                                                                    <div className="profile-statNum">{followMeta.counts.followers}</div>
                                                                    <div className="profile-statLabel">Followers</div>
                                                                </div>

                                                                <div className="profile-statPill">
                                                                    <div className="profile-statNum">{followMeta.counts.following}</div>
                                                                    <div className="profile-statLabel">Following</div>
                                                                </div>
                                                            </div>

                                                            {!isSelf ? (
                                                                <div className="profile-actions">
                                                                    <Button
                                                                        variant={followMeta.following ? "normal" : "primary"}
                                                                        loading={followLoading}
                                                                        onClick={handleFollowToggle}
                                                                    >
                                                                        {followMeta.following ? "Following" : "Follow"}
                                                                    </Button>

                                                                    {followMeta.followedBy ? (
                                                                        <StatusIndicator type="info">Follows you</StatusIndicator>
                                                                    ) : null}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* PROFILE BIO */}
                                                <div className="profile-text">
                                                    <Box margin={{ top: "s" }} color="text-body-secondary">
                                                        Bio: {profile.bio?.trim()
                                                            ? profile.bio
                                                            : "This user hasn’t added a bio yet."}
                                                    </Box>
                                                </div>

                                                 {/* PROFILE RESUME */}
                                                <div className="profile-text">
                                                    <Box margin={{ top: "s" }} color="text-body-secondary">
                                                        {profile.resume_url ? (
                                                            <>
                                                                Resume:{" "}
                                                                <Link
                                                                    external
                                                                    externalIconAriaLabel="Opens in a new tab"
                                                                    href={toAbsoluteUrl(profile.resume_url)}
                                                                >
                                                                    View PDF
                                                                </Link>
                                                            </>
                                                        ) : (
                                                            "Resume: This user hasn’t uploaded a resume yet."
                                                        )}
                                                    </Box>
                                                </div>
                                            </div>
                                        </Container>

                                        {/* MAIN GRID */}
                                        <Grid
                                            gridDefinition={[
                                                { colspan: { default: 12, l: 6 } },
                                                { colspan: { default: 12, l: 6 } },
                                                { colspan: { default: 12, l: 6 } },
                                                { colspan: { default: 12, l: 6 } },
                                                { colspan: { default: 12, l: 6 } }
                                            ]}
                                        >
                                            {/* PROJECTS */}
                                            <Container header={<Header variant="h2">Projects</Header>}>
                                                <SpaceBetween size="s">
                                                    {projects.length === 0 ? (
                                                        <Box color="text-body-secondary">No projects yet.</Box>
                                                    ) : (
                                                        projects.slice(0, 6).map((p) => {
                                                            const start = p.start_date ? String(p.start_date).slice(0, 10) : "";
                                                            const end = p.is_current ? "Present" : p.end_date ? String(p.end_date).slice(0, 10) : "";
                                                            const dates =
                                                                start || end ? `${start}${ start && end ? " – " : "" }${end}` : "";

                                                            return (
                                                                <div key={p.id} className="profile-itemRow">
                                                                    <div className="profile-itemText">
                                                                        <div className="profile-itemTitleRow">
                                                                            <span className="profile-itemTitle">{p.title}</span>
                                                                        </div>

                                                                        <div className="profile-itemMeta">
                                                                            ({p.organization ? (
                                                                                <span className="profile-itemOrg">{p.organization}</span>
                                                                            ) : (
                                                                                <span className="profile-itemOrg">Project</span>
                                                                            )})
                                                                            
                                                                            {dates ? (
                                                                                <span className="profile-itemDates">{dates}</span>
                                                                            ) : null}
                                                                        </div>

                                                                        {renderDetails(p.details)}
                                                                    </div>
                                                                    <div className="profile-link">
                                                                        {p.url && (
                                                                            <Badge>
                                                                                <Link external href={p.url} variant="primary">
                                                                                    {safeHost(p.url) || "Link"}
                                                                                </Link>
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </SpaceBetween>
                                            </Container>

                                            {/* EXPERIENCE */}
                                            <Container header={<Header variant="h2">Experience</Header>}>
                                                <SpaceBetween size="s">
                                                    {experiences.length === 0 ? (
                                                        <Box color="text-body-secondary">No experience yet.</Box>
                                                    ) : (
                                                        experiences.slice(0, 6).map((e) => {
                                                            const start = e.start_date ? String(e.start_date).slice(0, 10) : "";
                                                            const end = e.is_current ? "Present" : e.end_date ? String(e.end_date).slice(0, 10) : "";
                                                            const dates =
                                                                start || end ? `${start}${ start && end ? " – " : "" }${end}` : "";

                                                            return (
                                                                <div key={e.id} className="profile-itemRow">
                                                                    <div className="profile-itemText">
                                                                        <div className="profile-itemTitleRow">
                                                                            <span className="profile-itemTitle">{e.title}</span>
                                                                        </div>

                                                                        <div className="profile-itemMeta">
                                                                            ({e.organization ? (
                                                                                <span className="profile-itemOrg">{e.organization}</span>
                                                                            ) : null})

                                                                            {dates ? (
                                                                                <span className="profile-itemDates">{dates}</span>
                                                                            ) : null}
                                                                        </div>

                                                                        {renderDetails(e.details)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </SpaceBetween>
                                            </Container>

                                            {/* EDUCATION */}
                                            <Container header={<Header variant="h2">Education</Header>}>
                                                <SpaceBetween size="s">
                                                    {education.length === 0 ? (
                                                        <Box color="text-body-secondary">No education yet.</Box>
                                                    ) : (
                                                        education.slice(0, 6).map((ed) => {
                                                            const start = ed.start_date ? String(ed.start_date).slice(0, 10) : "";
                                                            const end = ed.is_current ? "Present" : ed.end_date ? String(ed.end_date).slice(0, 10) : "";
                                                            const dates =
                                                                start || end ? `${start}${ start && end ? " – " : "" }${end}` : "";

                                                            return (
                                                                <div key={ed.id} className="profile-itemRow">
                                                                    <div className="profile-itemText">
                                                                        <div className="profile-itemTitleRow">
                                                                            <span className="profile-itemTitle">{ed.title}</span>
                                                                        </div>

                                                                        <div className="profile-itemMeta">
                                                                            ({ed.organization ? (
                                                                                <span className="profile-itemOrg">{ed.organization}</span>
                                                                            ) : null})

                                                                            {dates ? (
                                                                                <span className="profile-itemDates">{dates}</span>
                                                                            ) : null}
                                                                        </div>

                                                                        {renderDetails(ed.details)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </SpaceBetween>
                                            </Container>

                                            {/* AFFILIATIONS */}
                                            <Container header={<Header variant="h2">Affiliations</Header>}>
                                                <SpaceBetween size="s">
                                                    {affiliations.length === 0 ? (
                                                        <Box color="text-body-secondary">No affiliations yet.</Box>
                                                    ) : (
                                                        affiliations.slice(0, 10).map((a) => (
                                                            <div
                                                                key={a.id}
                                                                className="profile-bulletRow"
                                                            >
                                                                <Box fontWeight="bold">
                                                                    • {a.title} || {a.organization}
                                                                </Box>
                                                            </div>
                                                        ))
                                                    )}
                                                </SpaceBetween>
                                            </Container>

                                            {/* SKILLS */}
                                            <Container header={<Header variant="h2">Skills</Header>}>
                                                <Tabs
                                                    tabs={[
                                                        {
                                                            id: "hard",
                                                            label: `Hard skills (${hardSkills.length})`,
                                                            content: (
                                                                <div className="profile-pillWrap">
                                                                    {hardSkills.length === 0 ? (
                                                                        <Box color="text-body-secondary">No hard skills yet.</Box>
                                                                    ) : (
                                                                        hardSkills.map((s) => (
                                                                            <span
                                                                                key={s.id}
                                                                                className="profile-pill"
                                                                            >
                                                                                {s.name}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )
                                                        },
                                                        {
                                                            id: "soft",
                                                            label: `Soft skills (${softSkills.length})`,
                                                            content: (
                                                                <div className="profile-pillWrap">
                                                                    {softSkills.length === 0 ? (
                                                                        <Box color="text-body-secondary">
                                                                            No soft skills yet.
                                                                        </Box>
                                                                    ) : (
                                                                        softSkills.map((s) => (
                                                                            <span
                                                                                key={s.id}
                                                                                className="profile-pill"
                                                                            >
                                                                                {s.name}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )
                                                        }
                                                    ]}
                                                />
                                            </Container>
                                        </Grid>

                                        {viewer && (
                                            <Box color="text-body-secondary" fontSize="body-s">
                                                Viewing as: @{viewer.username}
                                            </Box>
                                        )}
                                    </SpaceBetween>
                                </ContentLayout>
                            </div>
                        </div>
                    }
                />
            </div>
        </>
    );
}
import React, { useContext, useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { FaUserEdit, FaFolderOpen } from "react-icons/fa";
import "@cloudscape-design/global-styles/index.css";
import {
    AppLayout, BreadcrumbGroup, ContentLayout, Header, Box, SpaceBetween, Button, Badge, SideNavigation, 
    StatusIndicator, KeyValuePairs, Container, Grid, Tabs, Modal, Form, FormField, Input, Textarea, Select
} from "@cloudscape-design/components";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import messages from "@cloudscape-design/components/i18n/messages/all.en";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

const LOCALE = "en";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [navigationOpen, setNavigationOpen] = useState(false);

    const [colorMode, setColorMode] = useState(() => {
        const saved = localStorage.getItem("cs-color-mode");
        return saved === "dark" ? "dark" : "light";
    });

    // Profile data
    const [profile, setProfile] = useState({
        bio: "",
        industryId: null,
        industryName: "",
        privacy: "public",
        tier: "free",
        title: "",
        city: "",
        state: "",
        country: "",
        updated: null,
    });
    const [profileLoading, setProfileLoading] = useState(true);
    const [editProfileOpen, setEditProfileOpen] = useState(false);

    // Industry options data
    const [industries, setIndustries] = useState([]);
    const [industriesLoading, setIndustriesLoading] = useState(true);

    const selectedIndustryOption = useMemo(() => {
        if (!profile.industryId) return null;
        const found = industries.find((i) => i.id === Number(profile.industryId));
        return found ? { label: found.name, value: String(found.id) } : null;
    }, [profile.industryId, industries]);

    // Portfolio entry items data (projects, experiences, affiliations)
    const [projects, setProjects] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [affiliations, setAffiliations] = useState([]);
    const [entriesLoading, setEntriesLoading] = useState(true);

    function safeHost(url) {
        try {
            if (!url) return "";
            const u = url.startsWith("http") ? url : `https://${url}`;
            return new URL(u).hostname;
        } catch {
            return "";
        }
    }

    // Skills data
    const [skillsOpen, setSkillsOpen] = useState(false);
    const [skillsLoading, setSkillsLoading] = useState(true);

    const [hardCatalog, setHardCatalog] = useState([]);
    const [hardUserSkills, setHardUserSkills] = useState([]);
    const [selectedHard, setSelectedHard] = useState(null);

    const [softCatalog, setSoftCatalog] = useState([]);
    const [softUserSkills, setSoftUserSkills] = useState([]);
    const [selectedSoft, setSelectedSoft] = useState(null);

    const loadSkills = async () => {
        setSkillsLoading(true);
        try {
            const [hc, sc, hu, su] = await Promise.all([
                fetch("/api/profile/skills/catalog?type=hard", { credentials: "include" }),
                fetch("/api/profile/skills/catalog?type=soft", { credentials: "include" }),
                fetch("/api/profile/skills?type=hard", { credentials: "include" }),
                fetch("/api/profile/skills?type=soft", { credentials: "include" }),
            ]);

            const [hcj, scj, huj, suj] = await Promise.all([
                hc.json(),
                sc.json(),
                hu.json(),
                su.json(),
            ]);

            if (hc.ok && hcj.status === "success") setHardCatalog(hcj.skills || []);
            if (sc.ok && scj.status === "success") setSoftCatalog(scj.skills || []);
            if (hu.ok && huj.status === "success") setHardUserSkills(huj.skills || []);
            if (su.ok && suj.status === "success") setSoftUserSkills(suj.skills || []);
        } catch (err) {
            console.error("loadSkills error:", err);
        } finally {
            setSkillsLoading(false);
        }
    };

    const fmtDate = (d) => {
        if (!d) return "";
        // Fixes data from "2025-12-10T05:00:00.000Z" to "2025-12-10"
        if (typeof d === "string") return d.slice(0, 10);
        return new Date(d).toISOString().slice(0, 10);
    };


    // When the page loads, apply light/dark mode
    useEffect(() => {
        const next = colorMode === "dark" ? Mode.Dark : Mode.Light;
        applyMode(next);
        localStorage.setItem("cs-color-mode", colorMode);
    }, [colorMode]);

    // When the page loads, verify session and load profile + stats + portfolio + skills
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

                await loadSkills();

                // 1) Ensure session is valid
                const sessionRes = await fetch("/api/session", {
                    method: "GET",
                    credentials: "include",
                });

                const sessionJson = await sessionRes.json();
                if (!sessionRes.ok || sessionJson.status !== "success") {
                    navigate("/login");
                    return;
                }

                if (!cancelled && setUser) {
                    setUser({
                        username: sessionJson.username,
                        email: sessionJson.email,
                    });
                }

                // 2) Fetch profile
                const profileRes = await fetch("/api/profile", {
                    method: "GET",
                    credentials: "include",
                });
                const profileJson = await profileRes.json();

                // If not cancelled, update profile
                if (!cancelled) {
                    if (profileRes.ok && profileJson.status === "success") {
                        const p = profileJson.profile || {};
                        setProfile({
                            bio: p.bio || "",
                            industryId: p.industry_id ?? null,
                            industryName: p.industry_name || "",
                            privacy: p.privacy || "public",
                            tier: p.tier || "free",
                            title: p.title || "",
                            city: p.city || "",
                            state: p.state || "",
                            country: p.country || "",
                            updated: p.updated || null,
                        });
                    }
                    setProfileLoading(false);
                }

                // 2b) Fetch industries for dropdown
                const industryRes = await fetch("/api/profile/industries", {
                    method: "GET",
                    credentials: "include",
                });
                const industryJson = await industryRes.json();

                // If not cancelled, update industries
                if (!cancelled) {
                    if (industryRes.ok && industryJson.status === "success") {
                        setIndustries(industryJson.industries || []);
                    }
                    setIndustriesLoading(false);
                }

                // 3) Fetch stats
                const statsRes = await fetch("/api/profile/stats", {
                    method: "GET",
                    credentials: "include",
                });
                const statsJson = await statsRes.json();

                // If not cancelled, update stats
                if (!cancelled) {
                    if (statsRes.ok && statsJson.status === "success") {
                        setStats(statsJson.stats);
                    }
                    setStatsLoading(false);
                }

                // 4) Fetch portfolio previews (projects, experiences, affiliations)
                const [projectRes, experienceRes, affiliationRes] = await Promise.all([
                    fetch("/api/profile/entries?type=project", { method: "GET", credentials: "include" }),
                    fetch("/api/profile/entries?type=job", { method: "GET", credentials: "include" }),
                    fetch("/api/profile/entries?type=affiliation", { method: "GET", credentials: "include" }),
                ]);

                const [projectJson, experienceJson, affiliationJson] = await Promise.all([
                    projectRes.json(),
                    experienceRes.json(),
                    affiliationRes.json(),
                ]);

                // If not cancelled, update portfolio
                if (!cancelled) {
                    if (projectRes.ok && projectJson.status === "success") setProjects(projectJson.entries || []);
                    if (experienceRes.ok && experienceJson.status === "success") setExperiences(experienceJson.entries || []);
                    if (affiliationRes.ok && affiliationJson.status === "success") setAffiliations(affiliationJson.entries || []);
                    setEntriesLoading(false);
                }

            } catch (err) {
                console.error("Dashboard load error:", err);
                if (!cancelled) {
                    setProfileLoading(false);
                    setStatsLoading(false);
                    setEntriesLoading(false);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [navigate, setUser]);

    // Profile data display values
    const displayName = user?.username || "User";
    const avatarLetter = displayName?.[0]?.toUpperCase() || "?";
    const industry = profile.industryName?.trim() ? profile.industryName : "Add industry (Edit profile)";
    const privacy = profile.privacy === "private" ? "Private" : "Public";
    const bio = profile.bio?.trim() ? profile.bio : "Add a short bio so people understand what you’re about.";
    const title = profile.title?.trim() ? profile.title : "Add title (Edit profile)";
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Add location (Edit profile)";


    // Stat data display values
    const [stats, setStats] = useState({
        projects: 0,
        experiences: 0,
        affiliations: 0,
        hardSkills: 0,
        softSkills: 0,
        profileViewsToday: 0,
        favorites: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Skill handling functions
    const addSkill = async (type) => {
        const selected = type === "hard" ? selectedHard : selectedSoft;
        if (!selected?.value) return;

        try {
            const res = await fetch("/api/profile/skills", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skill_id: Number(selected.value) }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                console.error("Add skill failed:", json);
                return;
            }

            await loadSkills();
            if (type === "hard") setSelectedHard(null);
            if (type === "soft") setSelectedSoft(null);
        } catch (err) {
            console.error("addSkill error:", err);
        }
    };

    const removeSkill = async (skillId) => {
        try {
            const res = await fetch(`/api/profile/skills/${skillId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                console.error("Remove skill failed:", json);
                return;
            }

            await loadSkills();
        } catch (err) {
            console.error("removeSkill error:", err);
        }
    };


    if (loading) return <div className="dash-loading">Loading...</div>;

    return (
        <>
            <Navbar />
            <div className="app-under-navbar">
                <I18nProvider locale={LOCALE} messages={[messages]}>
                    <AppLayout
                        navigationOpen={navigationOpen}
                        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
                        breadcrumbs={
                            <BreadcrumbGroup
                                items={[
                                    { text: "Home", href: "/dashboard" },
                                    { text: "Dashboard", href: "/dashboard" },
                                ]}
                            />
                        }
                        navigation={
                            <SideNavigation
                                header={{ href: "/dashboard", text: "Portfolio" }}
                                items={[
                                    { type: "link", text: "Profile", href: "/portfolio" },
                                    { type: "link", text: "Projects", href: "/profile/manage?type=project" },
                                    { type: "link", text: "Experiences", href: "/profile/manage?type=job" },
                                    { type: "link", text: "Affiliations", href: "/profile/manage?type=affiliation" },
                                    { type: "link", text: "Skills", href: "/dashboard" },
                                ]}
                            />
                        }

                        content={
                            <div className="dash-page">
                                <ContentLayout
                                    header={
                                        <div className="dashboard-header">
                                                <div className="dashboard-headerLeft">
                                                <Header variant="h1">
                                                    Welcome back, {displayName}!
                                                </Header>
                                            </div>

                                            {/* <div className="dashboard-headerRight">
                                                <Button variant="normal" onClick={() => setColorMode((m) => (m === "dark" ? "light" : "dark"))}>
                                                    {colorMode === "dark" ? "Light mode" : "Dark mode"}
                                                </Button>
                                            </div> */}
                                        </div>
                                    }
                                >
                                    <SpaceBetween size="l">
                                        {/* HEADER SECTION */}
                                        <Container>
                                            <div className="dash-profileHeader">
                                                {/* Top row */}
                                                <div className="dash-profileTop">
                                                    <div className="dash-profileIdentity">
                                                        <div className="dash-avatarCircle">{avatarLetter}</div>

                                                        <div className="dash-profileText">
                                                            <div className="dash-profileNameRow">
                                                                <Box fontWeight="bold" fontSize="heading-m">
                                                                    @{displayName}
                                                                </Box>
                                                                <StatusIndicator type="success">Active</StatusIndicator>
                                                            </div>

                                                            <Box color="text-body-secondary" margin={{ top: "xxs" }}>
                                                                Privacy: {profileLoading ? "Loading..." : privacy}
                                                            </Box>
                                                        </div>
                                                    </div>

                                                    <div className="dash-profileActions">
                                                        <Button className="dash-editProfileBtn" variant="secondary" onClick={() => setEditProfileOpen(true)}>
                                                            <FaUserEdit style={{ marginRight: 8 }} />
                                                            Edit profile
                                                        </Button>

                                                        <Button variant="primary" onClick={() => navigate("/portfolio")}>
                                                            <FaFolderOpen style={{ marginRight: 8 }} />
                                                            View portfolio
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* PROFILE TAGS */}
                                                <div className="dash-profileTags">
                                                    <span className="dash-tag">
                                                        <span className="dash-tagLabel">Industry</span>
                                                        <span className="dash-tagValue">{profileLoading ? "Loading..." : industry}</span>
                                                    </span>

                                                    <span className="dash-tag">
                                                        <span className="dash-tagLabel">Title</span>
                                                        <span className="dash-tagValue">{title}</span>
                                                    </span>

                                                    <span className="dash-tag">
                                                        <span className="dash-tagLabel">Location</span>
                                                        <span className="dash-tagValue">{location}</span>
                                                    </span>
                                                </div>

                                                {/* BIO */}
                                                <Box margin={{ top: "s" }} color="text-body-secondary">
                                                    {profileLoading ? "Loading bio..." : `Bio: ${bio}`}
                                                </Box>

                                                {/* STAT TILES */}
                                                <div className="dash-stats">
                                                    <div className="dash-stat">
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.projects}</div>
                                                        <div className="dash-statLabel">Projects</div>
                                                    </div>

                                                    <div className="dash-stat">
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.experiences}</div>
                                                        <div className="dash-statLabel">Experiences</div>
                                                    </div>

                                                    <div className="dash-stat">
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.affiliations}</div>
                                                        <div className="dash-statLabel">Affiliations</div>
                                                    </div>

                                                    <div className="dash-stat">
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.hardSkills}</div>
                                                        <div className="dash-statLabel">Hard skills</div>
                                                    </div>

                                                    <div className="dash-stat">
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.softSkills}</div>
                                                        <div className="dash-statLabel">Soft skills</div>
                                                    </div>
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
                                            ]}
                                        >
                                            {/* PROJECTS */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile/manage?type=project")}>Manage</Button>
                                                        }
                                                    >
                                                        Projects
                                                    </Header>
                                                }
                                            >
                                                <SpaceBetween size="s">
                                                    <Box color="text-body-secondary">
                                                        Pin your best projects so recruiters see them first.
                                                    </Box>
                                                    <div className="dash-list">
                                                        {entriesLoading ? (
                                                            <Box color="text-body-secondary">Loading projects...</Box>
                                                        ) : projects.length === 0 ? (
                                                            <Box color="text-body-secondary">No projects yet.</Box>
                                                        ) : (
                                                            projects.slice(0, 3).map((p) => (
                                                                <div key={p.id} className="dash-rowItem">
                                                                    <div>
                                                                        <Box fontWeight="bold">{p.title}</Box>
                                                                        <Box color="text-body-secondary">{p.organization || "Project"}</Box>
                                                                    </div>
                                                                    {p.url ? <Badge>{safeHost(p.url) || "Link"}</Badge> : null}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <Button iconName="add-plus" onClick={() => navigate("/profile/manage?type=project&add=1")}>
                                                        Add project
                                                    </Button>
                                                </SpaceBetween>
                                            </Container>

                                            {/* EXPERIENCE */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile/manage?type=job")}>Manage</Button>
                                                        }
                                                    >
                                                        Experience
                                                    </Header>
                                                }
                                            >
                                                <SpaceBetween size="s">
                                                    <Box color="text-body-secondary">
                                                        Internships, roles, research, leadership, or
                                                        key coursework.
                                                    </Box>
                                                    <div className="dash-list">
                                                        {entriesLoading ? (
                                                            <Box color="text-body-secondary">Loading experience...</Box>
                                                        ) : experiences.length === 0 ? (
                                                            <Box color="text-body-secondary">No experience yet.</Box>
                                                        ) : (
                                                            experiences.slice(0, 3).map((e) => (
                                                                <div key={e.id} className="dash-rowItem">
                                                                    <div>
                                                                        <Box fontWeight="bold">{e.title}</Box>
                                                                        {/* <Box color="text-body-secondary">
                                                                            {e.organization || ""}
                                                                            {e.start_date
                                                                                ? ` • ${e.start_date}${e.is_current ? " – Present" : e.end_date ? ` – ${e.end_date}` : ""}`
                                                                                : ""}
                                                                        </Box> */}
                                                                        <Box color="text-body-secondary">
                                                                            {e.organization || ""}
                                                                            {e.start_date ? ` • ${fmtDate(e.start_date)}${e.is_current ? " – Present" : e.end_date ? ` – ${fmtDate(e.end_date)}` : ""}` : ""}
                                                                        </Box>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <Button iconName="add-plus" onClick={() => navigate("/profile/manage?type=job&add=1")}>
                                                        Add experience
                                                    </Button>
                                                </SpaceBetween>
                                            </Container>

                                            {/* AFFILIATIONS */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile/manage?type=affiliation")}>Manage</Button>
                                                        }
                                                    >
                                                        Affiliations
                                                    </Header>
                                                }
                                            >
                                                <SpaceBetween size="s">
                                                    <Box color="text-body-secondary">
                                                        Clubs, orgs, programs, volunteering,
                                                        certifications-in-progress.
                                                    </Box>

                                                    <div className="dash-list">
                                                        {entriesLoading ? (
                                                            <Box color="text-body-secondary">Loading affiliations...</Box>
                                                        ) : affiliations.length === 0 ? (
                                                            <Box color="text-body-secondary">No affiliations yet.</Box>
                                                        ) : (
                                                            affiliations.slice(0, 5).map((a) => (
                                                                <div key={a.id} className="dash-rowItem">
                                                                    <Box fontWeight="bold">• {a.title}</Box>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <Button iconName="add-plus" onClick={() => navigate("/profile/manage?type=affiliation&add=1")}>
                                                        Add affiliation
                                                    </Button>
                                                </SpaceBetween>
                                            </Container>

                                            {/* SKILLS */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => { setSkillsOpen(true); loadSkills(); }}> Manage </Button>
                                                        }
                                                    >
                                                        Skills
                                                    </Header>
                                                }
                                            >
                                                <Tabs
                                                    tabs={[
                                                        {
                                                            id: "hard",
                                                            label: "Hard skills",
                                                            content: (
                                                                <div className="dash-pillWrap">
                                                                    {skillsLoading ? (
                                                                        <Box color="text-body-secondary">Loading...</Box>
                                                                    ) : hardUserSkills.length === 0 ? (
                                                                        <Box color="text-body-secondary">No hard skills yet.</Box>
                                                                    ) : (
                                                                        hardUserSkills.map((s) => (
                                                                            <span key={s.id} className="dash-pill">
                                                                                {s.name}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            ),
                                                        },
                                                        {
                                                            id: "soft",
                                                            label: "Soft skills",
                                                            content: (
                                                                <div className="dash-pillWrap">
                                                                    {skillsLoading ? (
                                                                        <Box color="text-body-secondary">Loading...</Box>
                                                                    ) : softUserSkills.length === 0 ? (
                                                                        <Box color="text-body-secondary">No soft skills yet.</Box>
                                                                    ) : (
                                                                        softUserSkills.map((s) => (
                                                                            <span key={s.id} className="dash-pill">
                                                                                {s.name}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            ),
                                                        },
                                                    ]}
                                                />
                                            </Container>
                                        </Grid>

                                        {/* EDIT PROFILE MODAL */}
                                        <Modal
                                            visible={editProfileOpen}
                                            onDismiss={() => setEditProfileOpen(false)}
                                            header="Edit profile"
                                            footer={
                                                <Box float="right">
                                                    <SpaceBetween direction="horizontal" size="xs">
                                                        <Button variant="primary" onClick={async () => {
                                                                try {
                                                                    const res = await fetch("/api/profile", {
                                                                        method: "PUT",
                                                                        credentials: "include",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({
                                                                            bio: profile.bio,
                                                                            privacy: profile.privacy,
                                                                            industry_id: profile.industryId,
                                                                            title: profile.title,
                                                                            city: profile.city,
                                                                            state: profile.state,
                                                                            country: profile.country,
                                                                        }),
                                                                    });

                                                                    const json = await res.json().catch(() => ({}));
                                                                    if (!res.ok || json.status !== "success") {
                                                                        console.error("Save failed:", json);
                                                                        return;
                                                                    }

                                                                    setEditProfileOpen(false);
                                                                } catch (err) {
                                                                    console.error("Save profile error:", err);
                                                                }
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                    </SpaceBetween>
                                                </Box>
                                            }
                                        >
                                            <Form>
                                                <SpaceBetween size="m">
                                                    <FormField label="Industry">
                                                        <Select
                                                            statusType={industriesLoading ? "loading" : "finished"}
                                                            placeholder="Select an industry"
                                                            selectedOption={selectedIndustryOption}
                                                            options={industries.map((i) => ({
                                                                label: i.name,
                                                                value: String(i.id),
                                                            }))}
                                                            onChange={({ detail }) => {
                                                                const opt = detail.selectedOption;
                                                                setProfile((p) => ({
                                                                    ...p,
                                                                    industryId: opt?.value ? Number(opt.value) : null,
                                                                    industryName: opt?.label || "",
                                                                }));
                                                            }}
                                                            empty="No industries found."
                                                        />
                                                    </FormField>

                                                    <FormField label="Title">
                                                        <Input
                                                            value={profile.title}
                                                            onChange={(e) =>
                                                                setProfile((p) => ({
                                                                    ...p,
                                                                    title: e.detail.value,
                                                                }))
                                                            }
                                                        />
                                                    </FormField>
                                                    
                                                    <FormField label="City">
                                                        <Input
                                                            value={profile.city}
                                                            onChange={(e) => setProfile((p) => ({ ...p, city: e.detail.value }))}
                                                            placeholder="e.g., Newark"
                                                        />
                                                    </FormField>

                                                    <FormField label="State / Region">
                                                        <Input
                                                            value={profile.state}
                                                            onChange={(e) => setProfile((p) => ({ ...p, state: e.detail.value }))}
                                                            placeholder="e.g., NJ"
                                                        />
                                                    </FormField>

                                                    <FormField label="Country">
                                                        <Input
                                                            value={profile.country}
                                                            onChange={(e) => setProfile((p) => ({ ...p, country: e.detail.value }))}
                                                            placeholder="e.g., USA"
                                                        />
                                                    </FormField>

                                                    <FormField label="Bio">
                                                        <Textarea
                                                            value={profile.bio}
                                                            onChange={(e) =>
                                                                setProfile((p) => ({
                                                                    ...p,
                                                                    bio: e.detail.value,
                                                                }))
                                                            }
                                                            rows={4}
                                                        />
                                                    </FormField>
                                                </SpaceBetween>
                                            </Form>
                                        </Modal>

                                        <Modal
                                            visible={skillsOpen}
                                            onDismiss={() => setSkillsOpen(false)}
                                            header="Edit skills"
                                            footer={
                                                <Box float="right">
                                                    <SpaceBetween direction="horizontal" size="xs">
                                                        <Button variant="link" onClick={() => setSkillsOpen(false)}> Close </Button>
                                                    </SpaceBetween>
                                                </Box>
                                            }
                                        >
                                            <SpaceBetween size="l">
                                                <Box color="text-body-secondary">
                                                    Pick from the dropdown, then click Add.
                                                </Box>

                                                <Container header={<Header variant="h2">Hard skills</Header>}>
                                                    <SpaceBetween size="s">
                                                        <Select
                                                            statusType={skillsLoading ? "loading" : "finished"}
                                                            placeholder="Select a hard skill"
                                                            selectedOption={selectedHard}
                                                            options={hardCatalog.map((s) => ({
                                                                label: s.name,
                                                                value: String(s.id),
                                                            }))}
                                                            onChange={({ detail }) => setSelectedHard(detail.selectedOption)}
                                                        />
                                                        <Button variant="primary" disabled={!selectedHard?.value} onClick={() => addSkill("hard")}> Add </Button>

                                                        <div className="dash-pillWrap">
                                                            {hardUserSkills.length === 0 ? (
                                                                <Box color="text-body-secondary">No hard skills yet.</Box>
                                                            ) : (
                                                                hardUserSkills.map((s) => (
                                                                    <span key={s.id} className="dash-pill" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                                                        {s.name}
                                                                        <Button variant="icon" iconName="close" onClick={() => removeSkill(s.id)}/>
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </SpaceBetween>
                                                </Container>

                                                <Container header={<Header variant="h2">Soft skills</Header>}>
                                                    <SpaceBetween size="s">
                                                        <Select
                                                            statusType={skillsLoading ? "loading" : "finished"}
                                                            placeholder="Select a soft skill"
                                                            selectedOption={selectedSoft}
                                                            options={softCatalog.map((s) => ({
                                                                label: s.name,
                                                                value: String(s.id),
                                                            }))}
                                                            onChange={({ detail }) => setSelectedSoft(detail.selectedOption)}
                                                        />
                                                        <Button variant="primary" disabled={!selectedSoft?.value} onClick={() => addSkill("soft")}> Add </Button>

                                                        <div className="dash-pillWrap">
                                                            {softUserSkills.length === 0 ? (
                                                                <Box color="text-body-secondary">No soft skills yet.</Box>
                                                            ) : (
                                                                softUserSkills.map((s) => (
                                                                    <span key={s.id} className="dash-pill" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                                                        {s.name}
                                                                        <Button variant="icon" iconName="close" onClick={() => removeSkill(s.id)} />
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </SpaceBetween>
                                                </Container>
                                            </SpaceBetween>
                                        </Modal>
                                    </SpaceBetween>
                                </ContentLayout>
                            </div>
                        }
                    />
                </I18nProvider>
            </div>
        </>
    );
}
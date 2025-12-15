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
    const [navigationOpen, setNavigationOpen] = useState(true);

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
    // const [profile, setProfile] = useState({
    //     title: "DEV",
    //     industry: "TECH",
    //     location: "NJ",
    //     bio: "EXAMPLEEEEE",
    // });

    const [editProfileOpen, setEditProfileOpen] = useState(false);

    // Industry options
    const [industries, setIndustries] = useState([]);
    const [industriesLoading, setIndustriesLoading] = useState(true);

    const selectedIndustryOption = useMemo(() => {
        if (!profile.industryId) return null;
        const found = industries.find((i) => i.id === Number(profile.industryId));
        return found ? { label: found.name, value: String(found.id) } : null;
    }, [profile.industryId, industries]);

    // Demo sections
    const projects = useMemo(
        () => [
            { id: "p1", name: "ShowcaseMe", stack: "React • Express • MariaDB", status: "Active" },
            { id: "p2", name: "Trip Planner", stack: "React • Google Maps API", status: "In progress" },
            { id: "p3", name: "Pentesting Run Book", stack: "Kali • SMB • Burp", status: "Active" },
        ],
        []
    );

    const experience = useMemo(
        () => [
            { id: "e1", role: "IT Intern", org: "Bruker", dates: "2024 – 2025" },
            { id: "e2", role: "Student Developer", org: "NJIT", dates: "Projects & labs" },
        ],
        []
    );

    const affiliations = useMemo(
        () => [
            { id: "a1", name: "NJIT Cybersecurity Club" },
            { id: "a2", name: "ACM (student member)" },
        ],
        []
    );

    const skills = useMemo(
        () => ({
            hard: [
                "React",
                "Node.js",
                "Express",
                "AWS (VPC/EC2/RDS/IAM)",
                "SQL",
                "Burp Suite",
                "nmap",
            ],
            soft: [
                "Communication",
                "Problem solving",
                "Teamwork",
                "Presentation",
                "Time management",
            ],
        }),
        []
    );

    // Check session on when it loads
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/session", {
                    method: "GET",
                    credentials: "include",
                });
        
                const json = await res.json();
        
                if (res.ok && json.status === "success" && json.username) {
                    if (setUser) {
                        setUser({ username: json.username, email: json.email });
                    }
                    // In the future you can fetch stats here from a /api/dashboard endpoint
                    setLoading(false);
                } else {
                    navigate("/login");
                }
            } catch (err) {
                console.error("Error checking session on dashboard:", err);
                navigate("/login");
            }
        };
    
        checkSession();
    }, [navigate, setUser]);
    
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);

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
                const profRes = await fetch("/api/actions/profile", {
                    method: "GET",
                    credentials: "include",
                });
                const profJson = await profRes.json();

                if (!cancelled) {
                    if (profRes.ok && profJson.status === "success") {
                        const p = profJson.profile || {};
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
                const industryRes = await fetch("/api/actions/industries", {
                    method: "GET",
                    credentials: "include",
                });
                const industryJson = await industryRes.json();

                // If not cancelled, update industries
                if (!cancelled) {
                    if (industryJson.ok && indJson.status === "success") {
                        setIndustries(indJson.industries || []);
                    }
                    setIndustriesLoading(false);
                }

                // 3) Fetch stats
                const statsRes = await fetch("/api/actions/stats", {
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
            } catch (err) {
                console.error("Dashboard load error:", err);
                if (!cancelled) {
                    setProfileLoading(false);
                    setStatsLoading(false);
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


    // // TEMP: allow dashboard without auth
    // useEffect(() => {
    //     setLoading(false);
    // }, []);


    useEffect(() => {
        const next = colorMode === "dark" ? Mode.Dark : Mode.Light;
        applyMode(next);
        localStorage.setItem("cs-color-mode", colorMode);
    }, [colorMode]);


    const displayName = user?.username || "User";
    const avatarLetter = displayName?.[0]?.toUpperCase() || "?";

    const industry = profile.industryName?.trim() ? profile.industryName : "Add industry (Edit profile)";
    const privacy = profile.privacy === "private" ? "Private" : "Public";
    const bio = profile.bio?.trim() ? profile.bio : "Add a short bio so people understand what you’re about.";
    const title = profile.title?.trim() ? profile.title : "Add title (Edit profile)";
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Add location (Edit profile)";


    // Stat data
    const [stats, setStats] = useState({
        projects: 0,
        experience: 0,
        affiliations: 0,
        hardSkills: 0,
        softSkills: 0,
        profileViewsToday: 0,
        favorites: 0,
    });

    const [statsLoading, setStatsLoading] = useState(true);
    // const stats = useMemo(
    //     () => ({
    //         projects: projects.length,
    //         experience: experience.length,
    //         affiliations: affiliations.length,
    //         hardSkills: skills.hard.length,
    //         softSkills: skills.soft.length,
    //     }),
    //     [
    //         projects.length,
    //         experience.length,
    //         affiliations.length,
    //         skills.hard.length,
    //         skills.soft.length,
    //     ]
    // );

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
                                    { type: "link", text: "Profile", href: "/profile" },
                                    { type: "link", text: "Projects", href: "/profile?tab=projects" },
                                    { type: "link", text: "Experience", href: "/profile?tab=experience" },
                                    { type: "link", text: "Affiliations", href: "/profile?tab=affiliations" },
                                    { type: "link", text: "Skills", href: "/profile?tab=skills" },
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

                                            <div className="dashboard-headerRight">
                                                <Button
                                                    variant="normal"
                                                    onClick={() => setColorMode((m) => (m === "dark" ? "light" : "dark"))}
                                                >
                                                    {colorMode === "dark" ? "Light mode" : "Dark mode"}
                                                </Button>
                                            </div>
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
                                                        <div className="dash-avatarLg">{avatarLetter}</div>

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

                                                        <Button variant="primary" onClick={() => navigate("/profile")}>
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
                                                        <div className="dash-statValue">{statsLoading ? "—" : stats.experience}</div>
                                                        <div className="dash-statLabel">Experience</div>
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
                                                            <Button onClick={() => navigate("/profile?tab=projects")}>
                                                                Manage
                                                            </Button>
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
                                                        {projects.map((p) => (
                                                            <div key={p.id} className="dash-rowItem">
                                                                <div>
                                                                    <Box fontWeight="bold">
                                                                        {p.name}
                                                                    </Box>
                                                                    <Box color="text-body-secondary">
                                                                        {p.stack}
                                                                    </Box>
                                                                </div>
                                                                <Badge color="green">
                                                                    {p.status}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Button iconName="add-plus" onClick={() => navigate("/profile?tab=projects")}>
                                                        Add project
                                                    </Button>
                                                </SpaceBetween>
                                            </Container>

                                            {/* EXPERIENCE */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile?tab=experience")}>
                                                                Manage
                                                            </Button>
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
                                                        {experience.map((e) => (
                                                            <div key={e.id} className="dash-rowItem">
                                                                <div>
                                                                    <Box fontWeight="bold">
                                                                        {e.role}
                                                                    </Box>
                                                                    <Box color="text-body-secondary">
                                                                        {e.org} • {e.dates}
                                                                    </Box>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Button iconName="add-plus" onClick={() => navigate("/profile?tab=experience")}>
                                                        Add experience
                                                    </Button>
                                                </SpaceBetween>
                                            </Container>

                                            {/* AFFILIATIONS */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile?tab=affiliations")}>
                                                                Manage
                                                            </Button>
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
                                                        {affiliations.map((a) => (
                                                            <div key={a.id} className="dash-rowItem">
                                                                <Box fontWeight="bold">
                                                                    • {a.name}
                                                                </Box>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </SpaceBetween>
                                            </Container>

                                            {/* SKILLS */}
                                            <Container
                                                header={
                                                    <Header
                                                        actions={
                                                            <Button onClick={() => navigate("/profile?tab=skills")}>
                                                                Manage
                                                            </Button>
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
                                                                    {skills.hard.map((s) => (
                                                                        <span key={s} className="dash-pill">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ),
                                                        },
                                                        {
                                                            id: "soft",
                                                            label: "Soft skills",
                                                            content: (
                                                                <div className="dash-pillWrap">
                                                                    {skills.soft.map((s) => (
                                                                        <span key={s} className="dash-pill">
                                                                            {s}
                                                                        </span>
                                                                    ))}
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
                                                                    const res = await fetch("/api/actions/profile", {
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
                                                    {/* <FormField label="Location">
                                                        <Input
                                                            value={profile.location}
                                                            onChange={(e) =>
                                                                setProfile((p) => ({
                                                                    ...p,
                                                                    location: e.detail.value,
                                                                }))
                                                            }
                                                        />
                                                    </FormField> */}

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
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Learn.css";
import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween, Container,
    Select, Input, Button, Table, Link, StatusIndicator
} from "@cloudscape-design/components";

export default function Learn() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [industries, setIndustries] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState(null);

    const [q, setQ] = useState("");
    const [resources, setResources] = useState([]);

    const ensureSession = async () => {
        const sessionRes = await fetch("/api/session", { credentials: "include" });
        const sessionJson = await sessionRes.json().catch(() => ({}));
        if (!sessionRes.ok || sessionJson.status !== "success") {
            navigate("/login");
            return false;
        }
        return true;
    };

    const loadIndustries = async () => {
        const res = await fetch("/api/learn/industries", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.status !== "success") return [];

        return (json.industries || []).map((i) => ({
            label: i.name,
            value: String(i.id)
        }));
    };

    const loadResources = async ({ industryId, query }) => {
        if (!industryId) {
            setResources([]);
            return;
        }

        const url =
            query && query.trim()
                ? `/api/learn?industryId=${encodeURIComponent(industryId)}&q=${encodeURIComponent(query.trim())}`
                : `/api/learn?industryId=${encodeURIComponent(industryId)}`;

        const res = await fetch(url, { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.status !== "success") {
            setResources([]);
            return;
        }

        setResources(json.resources || []);
    };

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            try {
                const ok = await ensureSession();
                if (!ok) return;

                const opts = await loadIndustries();
                setIndustries(opts);

                // Auto-select first industry
                if (opts.length > 0) {
                    setSelectedIndustry(opts[0]);
                    await loadResources({ industryId: opts[0].value, query: "" });
                }
            } catch (err) {
                console.error("Learn boot error:", err);
            } finally {
                setLoading(false);
            }
        };

        boot();
    }, []);

    const tableItems = useMemo(() => {
        return resources.map((r) => ({
            id: r.id,
            title: r.title,
            provider: r.provider || "—",
            url: r.url,
            description: r.description || "—"
        }));
    }, [resources]);

    const columns = [
        {
            id: "title",
            header: "Title",
            cell: (item) => (
                <Link external href={item.url}>
                    {item.title}
                </Link>
            ),
            sortingField: "title"
        },
        {
            id: "provider",
            header: "Provider / Type",
            cell: (item) => item.provider || "—",
            sortingField: "provider"
        },
        {
            id: "description",
            header: "Description",
            cell: (item) => item.description || "—"
        }
    ];

    const onSearch = async () => {
        if (!selectedIndustry?.value) return;
        setLoading(true);
        try {
            await loadResources({ industryId: selectedIndustry.value, query: q });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="app-under-navbar">
                <AppLayout
                    navigationHide
                    toolsHide
                    content={
                        <div className="learn-page">
                            <ContentLayout
                                header={
                                    <Header
                                        variant="h1"
                                        description="Pick an industry and explore curated learning resources."
                                    >
                                        Learn
                                    </Header>
                                }
                            >
                                <SpaceBetween size="l">
                                    <Container>
                                        <SpaceBetween size="m">
                                            <Box fontWeight="bold">Industry</Box>

                                            <Select
                                                placeholder="Select an industry"
                                                selectedOption={selectedIndustry}
                                                options={industries}
                                                onChange={async ({ detail }) => {
                                                    const opt = detail.selectedOption;
                                                    setSelectedIndustry(opt);
                                                    setQ("");

                                                    setLoading(true);
                                                    try {
                                                        await loadResources({ industryId: opt?.value, query: "" });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            />

                                            <Box fontWeight="bold">Search resources</Box>
                                            <Input
                                                value={q}
                                                placeholder="Search by title, provider, description..."
                                                onChange={({ detail }) => setQ(detail.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") onSearch();
                                                }}
                                            />

                                            <SpaceBetween direction="horizontal" size="s">
                                                <Button onClick={onSearch} loading={loading}>
                                                    Search
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    onClick={async () => {
                                                        setQ("");
                                                        if (!selectedIndustry?.value) return;
                                                        setLoading(true);
                                                        try {
                                                            await loadResources({
                                                                industryId: selectedIndustry.value,
                                                                query: ""
                                                            });
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </SpaceBetween>
                                        </SpaceBetween>
                                    </Container>

                                    <Container>
                                        {loading ? (
                                            <Box color="text-body-secondary">Loading resources...</Box>
                                        ) : (
                                            <Table
                                                columnDefinitions={columns}
                                                items={tableItems}
                                                header={
                                                    <Header variant="h2">
                                                        <SpaceBetween direction="horizontal" size="s">
                                                            <div>
                                                                Resources ({tableItems.length})
                                                            </div>
                                                            <div>
                                                                {selectedIndustry ? (
                                                                    <StatusIndicator type="success">
                                                                        Showing: {selectedIndustry.label}
                                                                    </StatusIndicator>
                                                                ) : (
                                                                    <StatusIndicator type="info">Pick an industry to start</StatusIndicator>
                                                                )}
                                                            </div>
                                                        </SpaceBetween>
                                                    </Header>
                                                    
                                                }
                                                empty={
                                                    <Box color="text-body-secondary">
                                                        No resources found for this industry.
                                                    </Box>
                                                }
                                                stickyHeader
                                                wrapLines
                                            />
                                        )}
                                    </Container>
                                </SpaceBetween>
                            </ContentLayout>
                        </div>
                    }
                />
            </div>
        </>
    );
}
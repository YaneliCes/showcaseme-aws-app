import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PortfolioManager.css";
import Navbar from "../components/Navbar";
import {
    AppLayout, ContentLayout, Header, Box, SpaceBetween, Button, Tabs,
    Table, Modal, Form, FormField, Input, Textarea, Toggle, Flashbar, Link,
} from "@cloudscape-design/components";
import { useSearchParams } from "react-router-dom";

const TYPE_LABELS = {
    project: "Projects",
    job: "Experiences",
    affiliation: "Affiliations",
    education: "Education",
};

const emptyForm = (type) => ({
    id: null,
    type,
    title: "",
    organization: "",
    start_date: "",
    end_date: "",
    is_current: false,
    url: "",
    details: "",
    display_order: 0,
});

export default function PortfolioManager() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const allowed = new Set(["project", "job", "affiliation", "education"]);
    const typeFromUrl = searchParams.get("type");

    const [activeType, setActiveType] = useState(
        allowed.has(typeFromUrl) ? typeFromUrl : "project"
    );

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState(emptyForm(activeType));
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [flash, setFlash] = useState([]);

    const goBackToDashboard = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate("/dashboard");
    };


    const showMsg = (type, content) => {
        setFlash([{ type, content, dismissible: true, onDismiss: () => setFlash([]), id: "msg" }]);
    };

    const loadEntries = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/profile/entries?type=${encodeURIComponent(type)}`, {
                method: "GET",
                credentials: "include",
            });
            const json = await res.json();
            if (!res.ok || json.status !== "success") {
                showMsg("error", json.message || "Failed to load.");
                setEntries([]);
                return;
            }
            setEntries(json.entries || []);
        } catch (err) {
            console.error(err);
            showMsg("error", "Network error loading entries.");
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const type = searchParams.get("type");
        const shouldAdd = searchParams.get("add") === "1";

        if (type && allowed.has(type) && type !== activeType) {
            setActiveType(type);
        }

        if (shouldAdd) {
            setModalOpen(true);
            // Remove add=1 so refresh doesn't reopen modal
            searchParams.delete("add");
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams]);

    useEffect(() => {
        loadEntries(activeType);
        // Reset form when switching tabs
        setForm(emptyForm(activeType));
    }, [activeType]);


    const openAdd = () => {
        setForm(emptyForm(activeType));
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setForm({
            id: item.id,
            type: item.type,
            title: item.title || "",
            organization: item.organization || "",
            start_date: item.start_date ? String(item.start_date).slice(0, 10) : "",
            end_date: item.end_date ? String(item.end_date).slice(0, 10) : "",
            is_current: !!item.is_current,
            url: item.url || "",
            details: item.details || "",
            display_order: Number(item.display_order || 0),
        });
        setModalOpen(true);
    };

    const save = async () => {
        if (!form.title.trim()) {
            showMsg("error", "Title is required.");
            return;
        }

        setSaving(true);
        try {
            const isEdit = !!form.id;

            const url = isEdit ? `/api/profile/entries/${form.id}` : `/api/profile/entries`;

            const method = isEdit ? "PUT" : "POST";

            const payload = {
                type: form.type,
                title: form.title,
                organization: form.organization || null,
                start_date: form.start_date || null,
                end_date: form.is_current ? null : (form.end_date || null),
                is_current: form.is_current ? 1 : 0,
                url: form.url || null,
                details: form.details || null,
                display_order: Number(form.display_order || 0),
            };

            const res = await fetch(url, {
                method,
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                showMsg("error", json.message || "Save failed.");
                return;
            }

            setModalOpen(false);
            showMsg("success", "Saved!");
            await loadEntries(activeType);
        } catch (err) {
            console.error(err);
            showMsg("error", "Network error saving entry.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this entry?")) return;

        try {
            const res = await fetch(`/api/profile/entries/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.status !== "success") {
                showMsg("error", json.message || "Delete failed.");
                return;
            }
            showMsg("success", "Deleted.");
            await loadEntries(activeType);
        } catch (err) {
            console.error(err);
            showMsg("error", "Network error deleting entry.");
        }
    };

    const columns = useMemo(
        () => [
            {
                id: "title",
                header: "Title",
                cell: (e) => (
                    <div>
                        <Box fontWeight="bold">{e.title}</Box>
                        {e.organization ? (<Box color="text-body-secondary">{e.organization}</Box>) : null}
                    </div>
                ),
            },
            {
                id: "dates",
                header: "Dates",
                cell: (e) => {
                    const s = e.start_date ? String(e.start_date).slice(0, 10) : "—";
                    const end = e.is_current ? "Present" : (e.end_date ? String(e.end_date).slice(0, 10) : "—");
                    return `${s} → ${end}`;
                },
            },
            {
                id: "url",
                header: "Link",
                cell: (e) => e.url ? (<Link external href={e.url}>Open</Link>) : ("—"),
            },
            {
                id: "actions",
                header: "",
                cell: (e) => (
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button onClick={() => openEdit(e)}>Edit</Button>
                        <Button variant="link" onClick={() => remove(e.id)}>Delete</Button>
                    </SpaceBetween>
                ),
            },
        ],
        [activeType]
    );

    return (
        <>
            <Navbar />
            <div className="app-under-navbar"></div>

            <AppLayout
                navigationHide
                toolsHide
                content={
                    <div className="entries-page">
                        <ContentLayout
                            header={
                                <Header
                                    variant="h1"
                                    description="Manage projects, experience, affiliations."
                                    actions={
                                        <SpaceBetween direction="horizontal" size="xs">
                                            <Button variant="link" onClick={goBackToDashboard}>← Back to dashboard</Button>
                                            <Button iconName="add-plus" variant="primary" onClick={openAdd}>Add</Button>
                                        </SpaceBetween>
                                    }
                                >
                                    Manage Portfolio
                                </Header>
                            }
                        >
                            <SpaceBetween size="l">
                                {flash.length > 0 ? <Flashbar items={flash} /> : null}

                                <Tabs
                                    activeTabId={activeType}
                                    onChange={({ detail }) => {
                                        const nextType = detail.activeTabId;
                                        setActiveType(nextType);
                                        setSearchParams({ type: nextType });
                                    }}
                                    tabs={[
                                        {
                                            id: "project",
                                            label: TYPE_LABELS.project,
                                            content: null,
                                        },
                                        {
                                            id: "job",
                                            label: TYPE_LABELS.job,
                                            content: null,
                                        },
                                        {
                                            id: "affiliation",
                                            label: TYPE_LABELS.affiliation,
                                            content: null,
                                        },
                                    ]}
                                />

                                <Table
                                    loading={loading}
                                    loadingText="Loading entries"
                                    columnDefinitions={columns}
                                    items={entries}
                                    trackBy="id"
                                    empty={
                                        <Box padding="m" textAlign="center" color="text-body-secondary">
                                            No{" "} {TYPE_LABELS[activeType].toLowerCase()}{" "} yet. Click <b>Add</b> to create one.
                                        </Box>
                                    }
                                />

                                <Modal
                                    visible={modalOpen}
                                    onDismiss={() => setModalOpen(false)}
                                    header={
                                        form.id ? `Edit ${TYPE_LABELS[activeType].slice(0, -1)}` : `Add ${TYPE_LABELS[activeType].slice(0, -1)}`
                                    }
                                    footer={
                                        <Box float="right">
                                            <SpaceBetween direction="horizontal" size="xs">
                                                <Button variant="link" onClick={() => setModalOpen(false)}> Cancel </Button>
                                                <Button variant="primary" loading={saving} onClick={save}> Save </Button>
                                            </SpaceBetween>
                                        </Box>
                                    }
                                >
                                    <Form>
                                        <SpaceBetween size="m">
                                            <FormField label="Title" description="Ex: ShowcaseMe, IT Intern, NJIT Cybersecurity Club">
                                                <Input
                                                    value={form.title}
                                                    onChange={({ detail }) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            title: detail.value,
                                                        }))
                                                    }
                                                />
                                            </FormField>

                                            <FormField label="Organization" description="Optional (company, school, club, etc.)">
                                                <Input
                                                    value={form.organization}
                                                    onChange={({ detail }) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            organization: detail.value,
                                                        }))
                                                    }
                                                />
                                            </FormField>

                                            <SpaceBetween direction="horizontal" size="l">
                                                <FormField label="Start date">
                                                    <Input
                                                        type="date"
                                                        value={form.start_date}
                                                        onChange={({ detail }) =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                start_date: detail.value,
                                                            }))
                                                        }
                                                    />
                                                </FormField>

                                                <FormField label="End date">
                                                    <Input
                                                        type="date"
                                                        disabled={form.is_current}
                                                        value={form.end_date}
                                                        onChange={({ detail }) =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                end_date: detail.value,
                                                            }))
                                                        }
                                                    />
                                                </FormField>

                                                <FormField label="Current">
                                                    <Toggle
                                                        checked={form.is_current}
                                                        onChange={({ detail }) =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                is_current: detail.checked,
                                                            }))
                                                        }
                                                    >
                                                        Present
                                                    </Toggle>
                                                </FormField>
                                            </SpaceBetween>

                                            <FormField label="URL" description="Optional link (GitHub, live demo, org page)">
                                                <Input
                                                    value={form.url}
                                                    onChange={({ detail }) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            url: detail.value,
                                                        }))
                                                    }
                                                />
                                            </FormField>

                                            <FormField label="Details" description="Optional bullet-ish description">
                                                <Textarea
                                                    rows={5}
                                                    value={form.details}
                                                    onChange={({ detail }) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            details: detail.value,
                                                        }))
                                                    }
                                                />
                                            </FormField>

                                            <FormField label="Display order" description="Lower appears first (0 is fine).">
                                                <Input
                                                    type="number"
                                                    value={String(form.display_order)}
                                                    onChange={({ detail }) =>
                                                        setForm((p) => ({
                                                            ...p,
                                                            display_order: Number(detail.value || 0),
                                                        }))
                                                    }
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
        </>
    );
}
